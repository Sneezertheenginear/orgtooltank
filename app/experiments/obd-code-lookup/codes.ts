// The local OBD-II code library. Generic (SAE-defined) powertrain codes only, written in plain English.
// To add a code, add one entry to `codes` below, either written out or built with a family helper
// (sensor circuits, oxygen sensors, injectors, coils, cam timing, gear ratios, shift solenoids).
// The interface reads everything from this file, so nothing else needs to change.
//
// Wording rules for entries:
// - The meaning says what the computer detected, not which part failed.
// - Symptoms are things that *can* appear; many vehicles only show the check-engine light.
// - Check first starts with cheap, visual, and scan-tool checks before any expensive part.
// - No prices, no guarantees, no "safe to drive" verdicts from the code alone.
// - Only add a code when its standard definition is known. Manufacturer-specific codes (P1xxx and
//   others) don't belong here until vehicle-specific data exists.

export type Urgency = "low" | "soon" | "limit";
export type CodeInfo = {
  code: string;
  /** The standard (SAE J2012) description, lightly shortened. */
  title: string;
  system: string;
  meaning: string;
  symptoms: string[];
  checkFirst: string[];
  causes: string[];
  /** The part people are tempted to replace right away, and why the code doesn't prove it failed. */
  dontReplace: string;
  nextSteps: string[];
  urgency: Urgency;
  /** Extra driving-concern detail for this code, shown with the standard urgency wording. */
  urgencyNote?: string;
};

const LIVE_DATA = "Check for other stored and pending codes with a scan tool. Related codes often point to the real cause.";
const BANK = "Bank 1 is the side of the engine with cylinder 1; Bank 2 is the other side (V6 and V8 engines). Four-cylinder engines only have Bank 1.";
const CAM_LETTER = "Camshaft A is usually the intake camshaft and B the exhaust camshaft on engines that have both.";
const MISFIRE_NOTE = "A steady misfire lets unburned fuel into the exhaust, which can overheat the catalytic converter. If the check-engine light is flashing, reduce speed and load and get it checked.";

// ---------- Sensor circuit codes (one template for low / high / range / intermittent / no-signal codes) ----------

/**
 * How the sensor is wired decides what "low" and "high" usually mean:
 * - thermistor: two-wire temperature sensor. An open circuit reads very cold (high voltage); a short to ground reads very hot (low voltage).
 * - reference: three-wire sensor with a 5-volt reference, a ground, and a signal wire.
 * - powered: sensor with its own power feed (often 12 volts), ground, and signal.
 * - generator: speed, position, or knock sensor that makes its own signal as parts move.
 * - switch: multi-position switch, like most transmission range sensors.
 */
type Wiring = "thermistor" | "reference" | "powered" | "generator" | "switch";
type Sensor = {
  /** Short name used in sentences, e.g. "intake air temperature (IAT) sensor". */
  name: string;
  /** What the sensor does, written to follow its name: "The <name> <does>". */
  does: string;
  /** Extra background shown after what the computer detected (bank layout, location, signal source). */
  note?: string;
  system: string;
  wiring: Wiring;
  symptoms: string[];
  /** A live-data comparison that shows whether the reading makes sense. */
  compare: string;
  rangeCauses: string[];
  rangeDont: string;
  urgency: Urgency;
  urgencyNote?: string;
  /** Extra check for this sensor (for example, mounting or linkage). */
  extraCheck?: string;
  /** Extra "don't replace" detail for this sensor. */
  replaceNote?: string;
  lowReads?: string;
  highReads?: string;
};
type Kind = "circuit" | "range" | "low" | "high" | "intermittent" | "noSignal";

const electricalCheck: Record<Wiring, string> = {
  thermistor: "Measure the sensor's resistance and compare it with the temperature chart for your vehicle.",
  reference: "With the key on, check the 5-volt reference, ground, and signal at the connector. Other sensors often share the same 5-volt reference, so a short in one can affect the others.",
  powered: "With the key on, check for power (often 12 volts), ground, and signal at the connector, and check the fuse that feeds the sensor.",
  generator: "Check the sensor's signal with a scan tool or meter (while cranking, idling, or driving, depending on the sensor), and look for metal debris on the tip of a magnetic sensor.",
  switch: "Check the switch's power, ground, and signal circuits at the connector against the wiring diagram for your vehicle.",
};
const lowCauses: Record<Wiring, string[]> = {
  thermistor: ["Sensor shorted internally", "Signal wire shorted to ground", "Damaged connector"],
  reference: ["Open or shorted signal wire", "Lost 5-volt reference (sometimes from another shorted sensor)", "Bad connector", "Failed sensor"],
  powered: ["Missing power or ground", "Open or shorted signal wire", "Bad connector", "Failed sensor"],
  generator: ["Open or shorted wiring", "Bad connector", "Loose or damaged sensor", "Failed sensor"],
  switch: ["Open or shorted wiring", "Bad connector", "Worn switch contacts"],
};
const highCauses: Record<Wiring, string[]> = {
  thermistor: ["Unplugged or corroded connector", "Broken signal or ground wire", "Failed sensor"],
  reference: ["Open or poor ground", "Signal wire shorted to voltage", "Bad connector", "Failed sensor"],
  powered: ["Poor ground", "Signal wire shorted to voltage", "Bad connector", "Failed sensor"],
  generator: ["Wiring shorted to voltage", "Electrical interference from nearby wiring", "Bad connector", "Failed sensor"],
  switch: ["Wiring shorted to voltage", "Bad connector", "Worn switch contacts"],
};
const lowMeaning: Record<Wiring, string> = {
  thermistor: "That usually points to a short to ground in the sensor or its wiring.",
  reference: "That usually points to a broken signal wire, a missing 5-volt reference, or a short to ground.",
  powered: "That usually points to missing power or ground, or a problem in the signal wire.",
  generator: "That usually points to a wiring problem or a sensor that isn't producing a proper signal.",
  switch: "That usually points to a wiring problem or worn switch contacts.",
};
const highMeaning: Record<Wiring, string> = {
  thermistor: "That usually points to an open circuit, such as an unplugged connector or a broken wire.",
  reference: "That usually points to a poor ground or a signal wire shorted to voltage.",
  powered: "That usually points to a poor ground or a signal wire shorted to voltage.",
  generator: "That usually points to a wiring problem, electrical interference, or a failed sensor.",
  switch: "That usually points to a wiring problem or worn switch contacts.",
};

function sensorCode(code: string, title: string, s: Sensor, kind: Kind): CodeInfo {
  const detected = {
    circuit: "The computer found a problem in its circuit: the signal is missing or outside the range it expects.",
    range: "It's sending a signal, but the reading doesn't make sense compared with other sensors and driving conditions.",
    low: `Its signal is lower than it should ever be${s.lowReads ? `, which makes the computer think ${s.lowReads}` : ""}. ${lowMeaning[s.wiring]}`,
    high: `Its signal is higher than it should ever be${s.highReads ? `, which makes the computer think ${s.highReads}` : ""}. ${highMeaning[s.wiring]}`,
    intermittent: "Its signal is cutting in and out. That usually points to a loose connector, a damaged wire, or a sensor that fails when it gets hot.",
    noSignal: "The computer isn't seeing any signal from it.",
  }[kind];
  const specific = kind === "low" && s.wiring === "thermistor" ? "Unplug the sensor with the key on. The reading should drop to its coldest value (often -40°). If it does, the short is in the sensor, not the wiring."
    : kind === "high" && s.wiring === "thermistor" ? "With the sensor unplugged, briefly jumper the two connector terminals. The reading should jump to very hot, which proves the wiring and computer can see the circuit."
    : kind === "range" ? s.compare
    : kind === "intermittent" ? "Wiggle the wiring and connector while watching live data, and see whether the reading drops out."
    : electricalCheck[s.wiring];
  const causes = kind === "range" ? s.rangeCauses
    : kind === "low" ? lowCauses[s.wiring]
    : kind === "high" ? highCauses[s.wiring]
    : kind === "intermittent" ? ["Loose or corroded connector", "Chafed wire that opens or shorts with movement", "Sensor that fails when hot"]
    : ["Damaged wiring or connector", "Power or ground problem", `Failed ${s.name}`];
  return {
    code, title, system: s.system, meaning: `The ${s.name} ${s.does} ${detected}${s.note ? ` ${s.note}` : ""}`,
    symptoms: s.symptoms,
    checkFirst: [LIVE_DATA, `Inspect the ${s.name} connector and wiring for damage, corrosion, loose pins, or chafing.`, specific, ...(kind !== "range" && kind !== "circuit" ? [] : [kind === "range" ? electricalCheck[s.wiring] : s.compare]), ...(s.extraCheck ? [s.extraCheck] : [])],
    causes,
    dontReplace: kind === "range" ? s.rangeDont : `The ${s.name}. This is a circuit code, and a wiring or connector problem gives the same result. Test the circuit before buying the part.${s.replaceNote ? ` ${s.replaceNote}` : ""}`,
    nextSteps: kind === "range" ? ["Compare the reading with related sensors in live data under the same conditions.", "Check the circuit with a multimeter against the wiring diagram for your vehicle."]
      : kind === "intermittent" ? ["Graph the signal in live data while wiggling the wiring or while driving, and look for dropouts."]
      : ["Check the circuit with a multimeter against the wiring diagram and specification for your vehicle."],
    urgency: s.urgency, urgencyNote: s.urgencyNote,
  };
}

const MAF: Sensor = {
  name: "mass airflow (MAF) sensor", system: "Air intake", wiring: "powered",
  does: "measures how much air is entering the engine so the computer can add the right amount of fuel.",
  symptoms: ["Rough or unsteady idle", "Hesitation or stumbling when accelerating", "Stalling (sometimes)", "Lower fuel economy"],
  compare: "In live data, compare the MAF reading (grams per second) at warm idle with the specification for your engine.",
  rangeCauses: ["Air leak after the MAF sensor", "Dirty MAF sensor", "Wiring problem", "Failed MAF sensor"], rangeDont: "The MAF sensor. Air leaks and a dirty sensor are common causes.",
  urgency: "soon",
};
const MAP: Sensor = {
  name: "manifold absolute pressure (MAP) sensor", system: "Air intake", wiring: "reference",
  does: "measures pressure (vacuum) in the intake manifold, which the computer uses to work out engine load.",
  symptoms: ["Rough running or hesitation", "Poor fuel economy", "Black smoke or rich running", "Hard starting (sometimes)"],
  compare: "With the key on and engine off, the MAP reading should be close to barometric (outside air) pressure. At warm idle it should drop well below that as the engine makes vacuum.",
  rangeCauses: ["Cracked, disconnected, or plugged vacuum hose to the sensor", "Vacuum leak", "Low engine vacuum from a mechanical problem", "Failed MAP sensor"],
  rangeDont: "The MAP sensor. A cracked vacuum hose, a vacuum leak, or a real engine problem gives the same code.",
  extraCheck: "If the sensor connects to the intake with a hose, check that hose for cracks, a loose fit, or blockage.",
  urgency: "soon", lowReads: "there's very high vacuum (very light load)", highReads: "the engine is under very heavy load",
};
const IAT: Sensor = {
  name: "intake air temperature (IAT) sensor", system: "Air intake", wiring: "thermistor",
  does: "tells the computer how warm the incoming air is, which it uses to fine-tune fuel and timing.",
  symptoms: ["Often no noticeable change", "Hard starting in some conditions", "Slightly lower fuel economy"],
  compare: "With the engine cold (sitting overnight), the intake air temperature and coolant temperature in live data should be close to each other and to the outside temperature.",
  rangeCauses: ["Sensor reading inaccurately", "Heat soak or a sensor mounted in a hot spot", "Wiring resistance or a corroded connector"],
  rangeDont: "The IAT sensor. Compare it with coolant temperature on a cold engine first.",
  replaceNote: "On many vehicles the IAT sensor is built into the MAF sensor, so replacing it can mean buying a whole MAF sensor.",
  urgency: "low", lowReads: "the air is extremely hot", highReads: "the air is extremely cold",
  extraCheck: "If the air filter was recently changed, make sure the sensor or MAF connector was plugged back in.",
};
const ECT: Sensor = {
  name: "engine coolant temperature (ECT) sensor", system: "Engine cooling", wiring: "thermistor",
  does: "tells the computer how warm the engine is, which affects fuel, idle speed, cooling fans, and shifting.",
  symptoms: ["Cooling fans running all the time", "Hard starting", "Poor fuel economy or black smoke", "Temperature gauge reading wrong on some vehicles"],
  compare: "With the engine cold (sitting overnight), the coolant temperature in live data should be close to the intake air temperature. Then watch it rise smoothly as the engine warms up, with no jumps.",
  rangeCauses: ["Thermostat stuck open or closed", "Low coolant", "Sensor reading inaccurately", "Wiring resistance or a corroded connector"],
  rangeDont: "The coolant temperature sensor. A stuck thermostat or low coolant can make a good sensor's readings look wrong.",
  extraCheck: "With the engine cool, check the coolant level.",
  urgency: "soon", urgencyNote: "If the temperature gauge or a warning light shows real overheating, stop driving.",
};
const TPS_A: Sensor = {
  name: "throttle/pedal position sensor A", system: "Throttle control", wiring: "reference",
  does: "tells the computer how far the throttle (or gas pedal) is open.",
  symptoms: ["Reduced-power mode", "Hesitation or surging", "High or unsteady idle", "Shifting problems on automatics"],
  compare: "With the key on and engine off, slowly press the pedal while watching the position in live data. It should rise and fall smoothly with no jumps or dropouts.",
  rangeCauses: ["Worn sensor with a dead spot", "Intermittent wiring", "Dirty throttle body", "Electronic throttle body fault"],
  rangeDont: "The throttle body. Confirm the fault with live data first.",
  replaceNote: "On most newer vehicles the sensor is built into the throttle body or gas pedal assembly.",
  urgency: "limit", urgencyNote: "If the engine goes into reduced-power mode or the throttle responds unpredictably, avoid driving until it's checked.",
};
const TPS_B: Sensor = {
  ...TPS_A, name: "throttle/pedal position sensor B",
  does: "is the second of two position sensors that electronic throttles and gas pedals use to cross-check each other.",
  compare: "With the key on and engine off, slowly press the pedal while watching both position sensors in live data. Each should move smoothly, and they should track each other the way the specification describes.",
  rangeCauses: ["Worn sensor with a dead spot", "Intermittent wiring", "Sensors A and B disagreeing because one is failing", "Electronic throttle body or pedal assembly fault"],
};
const KNOCK = (bank: 1 | 2): Sensor => ({
  name: `knock sensor ${bank}`, system: "Ignition and misfire", wiring: "generator",
  does: `listens for engine knock (pinging) on ${bank === 1 ? "Bank 1, or the whole engine if there's only one sensor" : "Bank 2"}, so the computer can adjust spark timing to protect the engine.`, note: BANK,
  symptoms: ["Often no noticeable change", "Reduced power or fuel economy as the computer plays it safe with timing", "Audible pinging under load (sometimes)"],
  compare: "Watch knock retard or knock activity in live data. Some knock activity under hard acceleration is normal.",
  rangeCauses: ["Real engine knock (low-octane fuel, carbon buildup, overheating)", "Loose sensor", "Wiring problem", "Failed sensor"],
  rangeDont: "The knock sensor. It may be hearing real knock.",
  extraCheck: "Make sure the sensor is tightened to specification. A loose or overtightened knock sensor can misread. On V engines it's often under the intake manifold, so check whether recent work disturbed its wiring.",
  urgency: "soon",
});
const CKP: Sensor = {
  name: "crankshaft position sensor", system: "Engine timing", wiring: "generator",
  does: "tells the computer engine speed and crankshaft position. Without it, the engine may not run.",
  symptoms: ["Engine cranks but won't start", "Stalling, especially when warm", "Tachometer dropping out", "Rough running"],
  compare: "Watch the rpm reading in live data while cranking. Zero rpm while the engine turns over points to a missing crank signal.",
  rangeCauses: ["Damaged tone ring (reluctor)", "Incorrect sensor gap or loose mounting", "Wiring interference", "Failed sensor"],
  rangeDont: "The crankshaft sensor. A damaged tone ring or loose mounting gives the same code.",
  urgency: "limit", urgencyNote: "This problem can make the engine stall without warning while driving.",
};
const CMP = (bank: 1 | 2): Sensor => ({
  name: `camshaft position sensor A${bank === 2 ? " (Bank 2)" : ""}`, system: "Engine timing", wiring: "generator",
  does: "helps the computer time fuel and spark by tracking camshaft position.", note: bank === 2 ? BANK : undefined,
  symptoms: ["Long cranking or hard starting", "Stalling", "Rough running or reduced power"],
  compare: "Watch cam and crank correlation or cam position values in live data, if your scan tool shows them.",
  rangeCauses: ["Timing chain or belt wear", "Damaged tone ring", "Wiring interference", "Failed sensor"],
  rangeDont: "The camshaft sensor. Timing chain wear or a jumped belt can make a good sensor's signal look wrong.",
  urgency: "limit", urgencyNote: "This problem can cause stalling or no-start conditions.",
});
const EGR_SENSOR: Sensor = {
  name: "EGR sensor A", system: "Exhaust gas recirculation (EGR)", wiring: "reference",
  does: "reports EGR valve position or EGR flow to the computer, depending on the design.",
  symptoms: ["Often no noticeable change", "Pinging under load", "Rough idle (sometimes)"],
  compare: "Command the EGR valve open with a scan tool (where supported) and watch whether the sensor reading changes to match.",
  rangeCauses: ["Carbon-clogged EGR valve", "Wiring problem", "Failed sensor"], rangeDont: "The EGR valve. Test the sensor circuit first.",
  replaceNote: "On many vehicles the position sensor is built into the EGR valve.",
  urgency: "low",
};
const EVAP_SENSOR: Sensor = {
  name: "EVAP pressure sensor (fuel tank pressure sensor)", system: "Evaporative emissions (EVAP)", wiring: "reference",
  does: "measures pressure in the EVAP system, which the computer uses during its leak test.", note: "The sensor is often mounted on top of the fuel tank or near the charcoal canister.",
  symptoms: ["Usually none besides the check-engine light"],
  compare: "With the fuel cap removed, the sensor should read close to zero (atmospheric pressure) in live data.",
  rangeCauses: ["Blocked or kinked EVAP vent", "Sensor reading inaccurately", "Wiring problem"], rangeDont: "The pressure sensor. A blocked vent or hose can make a good sensor look wrong.",
  urgency: "low",
};
const VSS: Sensor = {
  name: "vehicle speed sensor A", system: "Vehicle speed", wiring: "generator",
  does: "reports how fast the vehicle is moving, which feeds the speedometer, shifting, cruise control, and more.", note: "On many vehicles the speed signal comes from the ABS wheel speed sensors or the transmission output speed sensor.",
  symptoms: ["Speedometer erratic or not working", "Harsh or odd shifting on automatics", "Cruise control not working"],
  compare: "Compare the speed in live data with actual speed (for example, a phone GPS app) on a test drive.",
  rangeCauses: ["Wrong tire size or final-drive ratio", "Damaged tone ring", "Wiring interference", "Failed sensor"],
  rangeDont: "The vehicle speed sensor. Tire size changes and damaged tone rings can make a good sensor's reading look wrong.",
  extraCheck: "Check for ABS wheel speed codes too. Many vehicles get vehicle speed from the ABS system.",
  urgency: "soon", urgencyNote: "Shifting and some safety systems may be affected.",
};
const TR: Sensor = {
  name: "transmission range sensor", system: "Transmission", wiring: "switch",
  does: "tells the computers which gear the shifter is in (Park, Reverse, Neutral, Drive, and so on).",
  symptoms: ["Engine won't start in Park or Neutral, or starts in another position", "Wrong gear shown on the dash", "Backup lights not working", "Harsh or odd shifting"],
  compare: "Move the shifter through each position with the key on and check that the gear shown in live data matches every time.",
  rangeCauses: ["Shifter linkage or cable out of adjustment", "Worn or dirty sensor contacts", "Wiring problem"],
  rangeDont: "The transmission range sensor. A shift cable or linkage out of adjustment gives the same code.",
  extraCheck: "Check the shift cable or linkage adjustment, especially after any transmission or shifter work.",
  urgency: "limit", urgencyNote: "Some vehicles may not start, or may start in gear, with this fault. Take care until it's checked.",
};
const TFT: Sensor = {
  name: "transmission fluid temperature sensor", system: "Transmission", wiring: "thermistor",
  does: "tells the transmission computer how warm the fluid is, which affects shift timing and torque converter lockup.",
  symptoms: ["Harsh or delayed shifts", "Torque converter clutch not locking up", "Limp mode (sometimes)"],
  compare: "On a cold vehicle, the fluid temperature in live data should be close to coolant and air temperature, then rise steadily as you drive.",
  rangeCauses: ["Low or overheated fluid", "Sensor reading inaccurately", "Wiring or connector problem (often inside the transmission)"],
  rangeDont: "The transmission computer. Check the fluid and the sensor circuit first.",
  replaceNote: "On many transmissions this sensor is inside the transmission, often on the internal wiring harness.",
  extraCheck: "Check the transmission fluid level and condition using the correct method for your vehicle.",
  urgency: "soon", lowReads: "the fluid is extremely hot", highReads: "the fluid is extremely cold",
};
const INPUT_SPEED: Sensor = {
  name: "input/turbine speed sensor", system: "Transmission", wiring: "generator",
  does: "measures how fast the transmission input is turning, which the transmission computer uses to control shifting.",
  symptoms: ["Harsh or erratic shifting", "Stuck in one gear (limp mode)", "Speedometer problems on some vehicles"],
  compare: "Watch input speed in live data on a test drive, and compare it with engine rpm when the torque converter is locked.",
  rangeCauses: ["Metal debris on the sensor", "Damaged wiring", "Internal transmission slipping", "Failed sensor"],
  rangeDont: "The transmission. A sensor or wiring problem gives the same code.",
  extraCheck: "Check the transmission fluid level and condition using the correct method for your vehicle.",
  urgency: "limit", urgencyNote: "If the transmission is stuck in one gear or shifting unpredictably, avoid highway driving until it's checked.",
};
const OUTPUT_SPEED: Sensor = {
  ...INPUT_SPEED, name: "output speed sensor",
  does: "measures how fast the transmission output shaft is turning. Many vehicles also use it for vehicle speed.",
  symptoms: ["Speedometer erratic or not working", "Harsh or erratic shifting", "Stuck in one gear (limp mode)"],
  compare: "Compare output speed or vehicle speed in live data with actual speed on a test drive.",
};

// ---------- Oxygen sensors (all four positions) ----------

type O2Kind = "circuit" | "low" | "high" | "slow" | "none" | "heater";
const o2Titles: Record<O2Kind, string> = { circuit: "O2 Sensor Circuit Malfunction", low: "O2 Sensor Circuit Low Voltage", high: "O2 Sensor Circuit High Voltage", slow: "O2 Sensor Circuit Slow Response", none: "O2 Sensor Circuit No Activity Detected", heater: "O2 Sensor Heater Circuit Malfunction" };

function o2(code: string, bank: 1 | 2, sensor: 1 | 2, kind: O2Kind): CodeInfo {
  const up = sensor === 1, where = up ? "upstream oxygen sensor (before the catalytic converter)" : "downstream oxygen sensor (after the catalytic converter)";
  const role = up ? "It tells the computer whether the exhaust is running rich or lean." : "It mainly checks how well the catalytic converter is working.";
  const live = up
    ? "With the engine fully warm, watch the sensor in live data. A traditional upstream oxygen sensor switches quickly between about 0.1 and 0.9 volts at a steady 2,500 rpm. Many newer vehicles use an air-fuel ratio sensor instead, which reads differently, so check which type your engine uses."
    : "With the engine fully warm, the downstream sensor usually stays fairly steady while the upstream sensor switches. It should still respond when the mixture changes, reading rich on hard acceleration and lean when you let off the gas.";
  const leak = `Look for exhaust leaks ahead of the sensor (cracked pipe or manifold, loose flange, leaking gasket). A leak pulls in outside air and throws the reading off.`;
  const wiring = up ? "Inspect the sensor connector and wiring near the exhaust for melted, chafed, or loose wiring." : "Inspect the sensor wiring under the vehicle, where road debris and exhaust heat can damage it.";
  const meaning = {
    circuit: `The ${where}'s signal isn't behaving as expected.`,
    low: `The ${where} is reading low voltage, which means lean, and staying there.`,
    high: `The ${where} is reading high voltage, which means rich, and staying there.`,
    slow: `The ${where} is switching between rich and lean too slowly. Sensors slow down with age and contamination.`,
    none: `The ${where}'s signal is stuck near the middle and isn't switching. The sensor may not be working, heating up, or connected.`,
    heater: `The ${where} has a built-in heater so it starts working quickly after a cold start, and the computer found a problem in that heater circuit.`,
  }[kind];
  const heater = kind === "heater";
  return {
    code, title: `${o2Titles[kind]} (Bank ${bank}, Sensor ${sensor})`, system: "Oxygen sensors",
    meaning: `${meaning} ${heater ? "" : `${role} `}${BANK}`,
    symptoms: ["Often no change in how the vehicle drives", "Lower fuel economy", ...(up && !heater ? ["Rough idle or hesitation (sometimes)"] : [])],
    checkFirst: heater
      ? [LIVE_DATA, "Check the fuse for the oxygen sensor heaters.", wiring, "With the key on, check for power on the heater supply wire at the connector."]
      : [LIVE_DATA, leak, wiring, live],
    causes: {
      circuit: ["Wiring or connector problem", "Exhaust leak near the sensor", "Failed oxygen sensor", "An actual fuel mixture problem"],
      low: [...(up ? ["A real lean condition (vacuum leak, low fuel pressure)"] : []), "Exhaust leak near the sensor", "Signal wire shorted to ground", "Failed oxygen sensor"],
      high: [...(up ? ["A real rich condition (leaking injector, high fuel pressure)"] : []), "Signal wire shorted to voltage", "Fuel or coolant contamination of the sensor", "Failed oxygen sensor"],
      slow: ["Aging or contaminated oxygen sensor", "Exhaust leak near the sensor", "Engine problem (misfire, oil burning) contaminating the sensor"],
      none: ["Open signal wire or unplugged connector", "Oxygen sensor heater not working", "Failed oxygen sensor"],
      heater: ["Failed heater element inside the sensor", "Blown fuse", "Open wiring or bad connector"],
    }[kind],
    dontReplace: {
      circuit: "The oxygen sensor. Check the wiring and look for exhaust leaks first.",
      low: up ? "The oxygen sensor. It may be correctly reporting a real lean condition or an exhaust leak." : "The oxygen sensor. Check for exhaust leaks and wiring damage first.",
      high: up ? "The oxygen sensor. It may be correctly reporting a real rich condition." : "The oxygen sensor. Check the wiring first, and make sure the engine isn't running rich.",
      slow: "This is one of the codes where the sensor itself is often at fault. Still, rule out exhaust leaks and oil or coolant burning, which can ruin a new sensor.",
      none: "The oxygen sensor. Check the connector, wiring, and heater circuit first. A heater fault can keep a good sensor from working.",
      heater: "The sensor often is the fix here, but check the fuse and power first. If several heater codes appear together, a shared fuse or power supply is more likely.",
    }[kind],
    nextSteps: heater ? ["Measure the heater's resistance at the sensor connector and compare it with the specification (usually only a few ohms)."]
      : kind === "low" && up ? ["Look at fuel trims. High positive trims suggest the engine really is lean.", "Graph the sensor signal and compare it with the service specification."]
      : kind === "high" && up ? ["Look at fuel trims. Strongly negative trims suggest the engine really is rich.", "Graph the sensor signal and compare it with the service specification."]
      : ["Graph the sensor signal in live data while the engine is warm and compare it with the service specification for your engine."],
    urgency: up && (kind === "low" || kind === "high") ? "soon" : "low",
  };
}

// ---------- Fuel mixture (lean / rich) ----------

function lean(code: string, bank: 1 | 2): CodeInfo {
  const other = bank === 1 ? "P0174" : "P0171";
  return {
    code, title: `System Too Lean (Bank ${bank})`, system: "Fuel and air mixture",
    meaning: `The engine computer has had to add more fuel than its normal limit on Bank ${bank} to keep the air-fuel mixture correct. That means the engine is getting more air than it's measuring, or less fuel than it expects. ${BANK}`,
    symptoms: ["Often no change beyond the check-engine light", "Rough or unsteady idle", "Hesitation when accelerating", "Misfires in some cases"],
    checkFirst: [
      LIVE_DATA,
      "Listen and look for vacuum leaks: cracked or disconnected hoses, the PCV valve and hose, the brake booster hose, and the intake boot between the air filter and throttle body.",
      "Check the MAF sensor for dirt or oil contamination. A dirty sensor under-reports airflow.",
      "Look for exhaust leaks ahead of the upstream oxygen sensor.",
      "In live data, compare long-term fuel trim at idle and at 2,500 rpm. If it gets much better at higher rpm, a vacuum leak is likely. If it gets worse under load, suspect fuel delivery.",
    ],
    causes: ["Vacuum or intake air leak", "Dirty or failing MAF sensor", "Low fuel pressure (weak pump, clogged filter, faulty regulator)", "Restricted or dirty fuel injectors", "Exhaust leak before the upstream oxygen sensor"],
    dontReplace: "The oxygen sensor. It's usually reporting the lean condition correctly, not causing it.",
    nextSteps: ["Smoke-test the intake for leaks.", "Test fuel pressure and compare it with the specification.", `If ${other} is also set, both banks are lean, which points to a shared cause like a MAF problem, low fuel pressure, or a large vacuum leak.`],
    urgency: "soon", urgencyNote: "A lean engine can start to misfire or run hot, so don't leave it for months.",
  };
}
function rich(code: string, bank: 1 | 2): CodeInfo {
  return {
    code, title: `System Too Rich (Bank ${bank})`, system: "Fuel and air mixture",
    meaning: `The engine computer has had to remove more fuel than its normal limit on Bank ${bank}. The engine is getting more fuel than it needs, or less air than it's measuring. ${BANK}`,
    symptoms: ["Lower fuel economy", "Fuel smell from the exhaust", "Black smoke or sooty tailpipe", "Rough idle"],
    checkFirst: [
      LIVE_DATA,
      "Check the air filter and air box for a restriction.",
      "Check the MAF sensor for contamination and compare its reading with the expected value.",
      "Check the EVAP purge valve. If it sticks open, it can feed extra fuel vapor into the engine.",
      "Compare the coolant temperature reading with the actual engine temperature. A sensor that reads cold makes the computer add fuel.",
      "Check the engine oil for a fuel smell, which can point to leaking injectors.",
    ],
    causes: ["Leaking fuel injector", "Fuel pressure too high (faulty regulator)", "Purge valve stuck open", "MAF sensor reading incorrectly", "Coolant temperature sensor reading too cold", "Restricted air intake"],
    dontReplace: "The oxygen sensor. It's usually reporting the rich condition correctly.",
    nextSteps: ["Test fuel pressure, including whether it holds or leaks down after shutoff.", "Watch fuel trims while briefly pinching or unplugging the purge line (if the engine allows it) to see if the purge system is adding fuel."],
    urgency: "soon", urgencyNote: "Running rich for a long time can overheat and damage the catalytic converter.",
  };
}
function trim(code: string, bank: 1 | 2): CodeInfo {
  return {
    code, title: `Fuel Trim Malfunction (Bank ${bank})`, system: "Fuel and air mixture",
    meaning: `The computer's fuel corrections on Bank ${bank} have reached their limit, either adding or removing as much fuel as it's allowed to. The code doesn't say which direction, so live data decides whether this is a lean or rich problem. ${BANK}`,
    symptoms: ["Often no change beyond the check-engine light", "Rough idle or hesitation", "Lower fuel economy"],
    checkFirst: [LIVE_DATA, "In live data, look at short-term and long-term fuel trim. Large positive numbers mean the computer is adding fuel (lean). Large negative numbers mean it's removing fuel (rich).", "If trims are positive, check for vacuum leaks, a dirty MAF sensor, and low fuel pressure.", "If trims are negative, check for leaking injectors, a purge valve stuck open, and high fuel pressure."],
    causes: ["Vacuum or intake air leak", "Dirty or failing MAF sensor", "Fuel pressure too low or too high", "Leaking or clogged injectors", "Exhaust leak before the upstream oxygen sensor"],
    dontReplace: "The oxygen sensor. It's reporting the mixture; the cause is usually air, fuel, or a sensor feeding the computer bad information.",
    nextSteps: ["Follow the lean or rich checks based on which way the fuel trims point.", "Smoke-test the intake and test fuel pressure."],
    urgency: "soon",
  };
}

// ---------- Misfires, injectors, and coils ----------

function misfire(cylinder: number): CodeInfo {
  return {
    code: `P030${cylinder}`, title: `Cylinder ${cylinder} Misfire Detected`, system: "Ignition and misfire",
    meaning: `The computer noticed cylinder ${cylinder} isn't firing properly. It watches how smoothly the crankshaft turns, and cylinder ${cylinder} isn't contributing its share of power. Cylinder numbering depends on the engine, so check the cylinder layout for yours.`,
    symptoms: ["Rough running or shaking, especially at idle", "Hesitation or loss of power", "A flashing check-engine light during a severe misfire"],
    checkFirst: [
      "Notice whether the check-engine light flashes. A flashing light means a severe misfire.",
      LIVE_DATA,
      `Pull and inspect cylinder ${cylinder}’s spark plug: worn electrode, wrong gap, oil or coolant fouling, or cracked porcelain.`,
      `Swap cylinder ${cylinder}’s ignition coil (or plug wire) with a neighboring cylinder, clear the code, and drive. If the misfire moves to the other cylinder, the coil is the problem.`,
      `Check the fuel injector connector for cylinder ${cylinder}, and look for a vacuum leak near that cylinder’s intake runner.`,
    ],
    causes: ["Worn or fouled spark plug", "Failing ignition coil or plug wire", "Clogged or failed fuel injector", "Vacuum leak near that cylinder", "Low compression (valve, ring, or head gasket problem)"],
    dontReplace: "The ignition coil. Do the swap test first. If the misfire stays with the cylinder, the coil wasn’t the problem.",
    nextSteps: [`If the coil and plug check out, swap or test the injector for cylinder ${cylinder}.`, `If ignition and fuel both check out, do a compression test (and a leak-down test if compression is low) on cylinder ${cylinder}.`],
    urgency: "limit", urgencyNote: MISFIRE_NOTE,
  };
}
function injector(cylinder: number): CodeInfo {
  return {
    code: `P020${cylinder}`, title: `Injector Circuit Malfunction – Cylinder ${cylinder}`, system: "Fuel injection",
    meaning: `The computer found an electrical problem in the fuel injector circuit for cylinder ${cylinder}: open, shorted, or not responding when it's switched on and off. Cylinder numbering depends on the engine, so check the layout for yours.`,
    symptoms: [`Misfire or rough running (often with a cylinder ${cylinder} misfire code)`, "Hesitation or loss of power", "Hard starting (sometimes)"],
    checkFirst: [LIVE_DATA, `Inspect the connector on cylinder ${cylinder}’s injector: is it fully seated and locked, with no corrosion or broken clip?`, "Inspect the injector wiring for chafing or damage, especially where it runs near hot parts or brackets.", `Measure cylinder ${cylinder}’s injector resistance and compare it with the other injectors and the specification.`],
    causes: ["Loose or corroded injector connector", "Damaged injector wiring", "Failed injector coil", "Injector power supply problem (fuse or relay)", "Injector driver in the engine computer (uncommon)"],
    dontReplace: "The engine computer. Injector connectors and wiring fail far more often. The injector itself is a common cause, but compare its resistance with the others first.",
    nextSteps: ["Use a noid light or test light at the injector connector while cranking to confirm the computer is switching it.", "Check for power at the injector connector with the key on."],
    urgency: "limit", urgencyNote: MISFIRE_NOTE,
  };
}
function coil(letter: string, cylinder: number): CodeInfo {
  return {
    code: `P035${cylinder}`, title: `Ignition Coil ${letter} Primary/Secondary Circuit Malfunction`, system: "Ignition and misfire",
    meaning: `The computer found an electrical problem in ignition coil ${letter}’s circuit. Coil ${letter} is usually the coil for cylinder ${cylinder}, but the lettering depends on the engine, so check the layout for yours.`,
    symptoms: ["Misfire or rough running", "Hesitation or loss of power", "A flashing check-engine light during a severe misfire"],
    checkFirst: [LIVE_DATA, `Inspect coil ${letter}’s connector: is it fully seated, with no corrosion or broken lock?`, "Inspect the coil wiring for chafing or heat damage.", "Check the fuse or relay that powers the ignition coils.", "Look for oil or water in the spark plug well, which can damage a coil."],
    causes: ["Failed ignition coil", "Loose or corroded connector", "Damaged coil wiring", "Coil power supply problem (fuse, relay, or ground)"],
    dontReplace: "All the coils. If several coil codes set at once, look for a shared power supply, fuse, or ground problem first.",
    nextSteps: [`If there's also a misfire on cylinder ${cylinder}, swap coil ${letter} with a neighboring coil and see whether the problem moves.`, "Check for power and the computer's trigger signal at the coil connector."],
    urgency: "limit", urgencyNote: MISFIRE_NOTE,
  };
}

// ---------- Variable valve timing and cam/crank correlation ----------

const oilFirst = "Check the engine oil level and condition first. Variable valve timing uses oil pressure, and low, dirty, or the wrong grade of oil can set these codes.";
function camCircuit(code: string, letter: "A" | "B", bank: 1 | 2): CodeInfo {
  return {
    code, title: `"${letter}" Camshaft Position Actuator Circuit (Bank ${bank})`, system: "Variable valve timing",
    meaning: `The computer found an electrical problem in the control circuit for camshaft ${letter}’s variable valve timing (VVT) solenoid on Bank ${bank}. ${CAM_LETTER} ${BANK}`,
    symptoms: ["Rough idle", "Reduced power or fuel economy", "Often no noticeable change"],
    checkFirst: [LIVE_DATA, "Inspect the VVT solenoid connector and wiring. Oil can leak into this connector.", "Measure the solenoid's resistance and compare it with the specification.", "Command the solenoid on and off with a scan tool (where supported) and listen or feel for it clicking."],
    causes: ["Failed VVT solenoid (electrical)", "Damaged wiring or oil-soaked connector", "Solenoid driver in the engine computer (uncommon)"],
    dontReplace: "The cam phaser or timing chain. This is an electrical code, so test the solenoid and its wiring first.",
    nextSteps: ["Check the solenoid circuit for power and ground against the wiring diagram."],
    urgency: "soon",
  };
}
function camTiming(code: string, letter: "A" | "B", bank: 1 | 2, direction: "advanced" | "retarded"): CodeInfo {
  return {
    code, title: `"${letter}" Camshaft Position – Timing ${direction === "advanced" ? "Over-Advanced or System Performance" : "Over-Retarded"} (Bank ${bank})`, system: "Variable valve timing",
    meaning: `The computer adjusts camshaft ${letter}’s timing on Bank ${bank} with the variable valve timing (VVT) system. The actual cam position ${direction === "advanced" ? "is further advanced than commanded, or isn't following commands well" : "is further retarded (behind) than commanded"}. ${CAM_LETTER} ${BANK}`,
    symptoms: ["Rough idle or stalling", "Reduced power or fuel economy", "Rattle at startup on some engines"],
    checkFirst: [oilFirst, LIVE_DATA, "Check the VVT solenoid and its connector. Some solenoids have a small oil screen that can clog.", "In live data, compare desired and actual cam position while the engine runs."],
    causes: ["Low, dirty, or incorrect engine oil", "Sticking VVT solenoid", "Worn cam phaser", "Stretched timing chain"],
    dontReplace: "The camshaft sensor. The sensor is usually reporting the timing correctly; oil, the VVT solenoid, or timing chain wear are more common causes.",
    nextSteps: ["Command the VVT solenoid with a scan tool and watch whether actual cam position follows.", "If the timing chain is suspected, have the timing marks checked."],
    urgency: "limit", urgencyNote: "Timing problems can lead to engine damage on some engines. Avoid hard driving until it's checked.",
  };
}
function correlation(code: string, bank: 1 | 2, sensor: "A" | "B"): CodeInfo {
  return {
    code, title: `Crankshaft Position – Camshaft Position Correlation (Bank ${bank} Sensor ${sensor})`, system: "Engine timing",
    meaning: `The timing between the crankshaft signal and camshaft ${sensor}’s signal on Bank ${bank} is different from what the computer expects. The engine's valve timing may be off, or a sensor or variable valve timing part isn't doing its job. ${CAM_LETTER} ${BANK}`,
    symptoms: ["Rattle at startup (on some engines)", "Rough idle", "Hard starting", "Reduced power or fuel economy"],
    checkFirst: [oilFirst, LIVE_DATA, "Listen for a timing chain rattle at startup.", "Check the variable valve timing (VVT) solenoid and its connector. Some have a small oil screen that can clog."],
    causes: ["Low or dirty engine oil", "Stretched timing chain or jumped timing belt", "Faulty VVT solenoid or cam phaser", "Cam or crank sensor or tone ring problem"],
    dontReplace: "The camshaft or crankshaft sensor. The real problem is often oil, the VVT system, or timing chain wear.",
    nextSteps: ["Check cam and crank correlation or VVT values in live data.", "If the timing chain is suspected, have the timing marks checked."],
    urgency: "limit", urgencyNote: "Timing problems can lead to engine damage on some engines. Avoid hard driving until it's checked.",
  };
}

// ---------- Catalytic converter ----------

function catalyst(code: string, bank: 1 | 2): CodeInfo {
  return {
    code, title: `Catalyst System Efficiency Below Threshold (Bank ${bank})`, system: "Catalytic converter",
    meaning: `The computer compares the oxygen sensors before and after the Bank ${bank} catalytic converter. The downstream sensor looks too much like the upstream one, which suggests the converter isn't cleaning the exhaust as well as it should. ${BANK}`,
    symptoms: ["Often none besides the check-engine light", "A rotten-egg smell (sometimes)", "Loss of power only if the converter is physically clogged, which is less common"],
    checkFirst: [
      "Fix any misfire, fuel trim, or oxygen sensor codes first. They can cause this code or damage the converter.",
      "Look for exhaust leaks near either oxygen sensor. A leak can make a good converter look bad.",
      "In live data with the engine warm, compare the sensors. The downstream sensor should stay fairly steady while the upstream sensor switches. If both switch the same way, the converter isn't storing oxygen well.",
      "Check whether the engine is burning oil or coolant. Both can coat and damage the converter.",
    ],
    causes: ["Aging or worn-out catalytic converter", "Exhaust leak near an oxygen sensor", "Slow or faulty downstream oxygen sensor", "An engine problem (misfire, rich running, oil burning) that damaged the converter"],
    dontReplace: "The catalytic converter. It's expensive, and exhaust leaks, sensor problems, or an unfixed engine problem can set this code. An unfixed engine problem will ruin a new converter too.",
    nextSteps: ["Graph the upstream and downstream sensors together at a steady 2,500 rpm, fully warm.", "Check for manufacturer service bulletins or software updates. Some vehicles have known fixes for this code."],
    urgency: "low",
  };
}

// ---------- EVAP ----------

const capCheck = "Check the gas cap first: tighten it until it clicks, and look for a cracked or missing seal. Aftermarket caps sometimes don't seal well.";
const evapHoses = "Inspect EVAP hoses and connections at the charcoal canister, purge valve, and vent valve for cracks, disconnected lines, or damage.";
const evapClear = "After a repair, the computer may need several drives to recheck the system before the light stays off.";
function evapLeak(code: string, title: string, size: string, urgencyNote?: string): CodeInfo {
  return {
    code, title, system: "Evaporative emissions (EVAP)",
    meaning: `The EVAP system traps fuel vapor from the tank instead of letting it escape. During its self-test, the computer found a ${size} in that sealed system.`,
    symptoms: ["Usually none besides the check-engine light", "A faint fuel smell (sometimes)"],
    checkFirst: [capCheck, "Inspect the filler neck for rust or damage where the cap seals.", evapHoses],
    causes: ["Loose, worn, or wrong gas cap", "Cracked or disconnected EVAP hose", "Leaking vent valve or purge valve", "Leaking charcoal canister", "Rusted filler neck"],
    dontReplace: "The charcoal canister or purge valve. A loose or worn gas cap and cracked hoses are common causes.",
    nextSteps: ["Have the EVAP system smoke-tested to find the leak.", evapClear],
    urgency: "low", urgencyNote,
  };
}
function evapValveCircuit(code: string, title: string, valve: "purge" | "vent"): CodeInfo {
  const purge = valve === "purge";
  return {
    code, title, system: "Evaporative emissions (EVAP)",
    meaning: purge
      ? "The computer found an electrical problem in the circuit for the EVAP purge valve, which lets stored fuel vapor into the engine to be burned."
      : "The computer found an electrical problem in the circuit for the EVAP vent valve, which lets fresh air in and out of the EVAP system and closes during the leak test.",
    symptoms: ["Usually none besides the check-engine light", ...(purge ? ["Rough idle or hard starting after refueling (sometimes)"] : ["The fuel pump nozzle clicking off early when refueling (sometimes)"])],
    checkFirst: [LIVE_DATA, `Inspect the ${valve} valve connector and wiring${purge ? "" : ". The vent valve is often near the charcoal canister or fuel tank, where dirt and water collect"}.`, `Measure the ${valve} valve's resistance and compare it with the specification.`, `Command the ${valve} valve on and off with a scan tool and listen for it clicking.`],
    causes: [`Failed ${valve} valve (electrical)`, "Damaged wiring or corroded connector", "Blown fuse or power supply problem", "Valve driver in the engine computer (uncommon)"],
    dontReplace: "The charcoal canister. This is an electrical code for the valve, so test the valve and its wiring first.",
    nextSteps: ["Check for power and ground at the valve connector against the wiring diagram.", evapClear],
    urgency: "low",
  };
}

// ---------- Transmission ----------

const fluidCheck = "Check the transmission fluid level and condition using the correct method for your vehicle. Dark, burnt-smelling, or low fluid matters. Some transmissions have no dipstick and need a specific procedure.";
const tcmCodes = "Read codes from the transmission control module with a scan tool that can reach it. Basic code readers often only see engine codes.";
const gearWords = ["", "first", "second", "third", "fourth", "fifth"];
function gearRatio(gear: number): CodeInfo {
  return {
    code: `P073${gear}`, title: `Gear ${gear} Incorrect Ratio`, system: "Transmission",
    meaning: `The transmission computer compared input and output speed in ${gearWords[gear]} gear, and the ratio doesn't match what ${gearWords[gear]} gear should be. That often means slipping in that gear.`,
    symptoms: [`Slipping or engine revving without matching acceleration in ${gearWords[gear]} gear`, "Harsh or delayed shifts", "Limp mode"],
    checkFirst: [fluidCheck, tcmCodes, "Look for fluid leaks under the vehicle."],
    causes: ["Low or worn-out fluid", `Worn clutches or bands used in ${gearWords[gear]} gear`, "Shift solenoid or valve body problem", "Speed sensor problem"],
    dontReplace: "The transmission. Low fluid, a sensor, or a solenoid can set this code. Get the fluid and full code list checked first.",
    nextSteps: ["Compare commanded gear with actual ratio in live data to confirm the slip."],
    urgency: "limit", urgencyNote: "A slipping transmission can get worse quickly. Avoid heavy driving and towing until it's checked.",
  };
}
type SolenoidKind = "malfunction" | "stuckOff" | "stuckOn" | "electrical";
function shiftSolenoid(code: string, letter: "A" | "B", kind: SolenoidKind): CodeInfo {
  const electrical = kind === "malfunction" || kind === "electrical";
  const title = { malfunction: `Shift Solenoid ${letter} Malfunction`, stuckOff: `Shift Solenoid ${letter} Performance or Stuck Off`, stuckOn: `Shift Solenoid ${letter} Stuck On`, electrical: `Shift Solenoid ${letter} Electrical` }[kind];
  return {
    code, title, system: "Transmission",
    meaning: electrical
      ? `The transmission computer found an electrical problem with shift solenoid ${letter}, one of the valves it uses to change gears.`
      : `The transmission computer commanded shift solenoid ${letter} ${kind === "stuckOn" ? "off" : "on"}, but the transmission behaves as if it's still ${kind === "stuckOn" ? "on" : "off"}. That points to a sticking solenoid or a hydraulic problem.`,
    symptoms: ["Harsh or delayed shifts", "Stuck in one gear (limp mode)", ...(electrical ? [] : ["Skipping gears or shifting at odd times"])],
    checkFirst: electrical
      ? [fluidCheck, tcmCodes, "Inspect the transmission connector for damage or fluid wicking into it, and check the wiring."]
      : [fluidCheck, tcmCodes, "Check whether the fluid has metal debris or clutch material in it, which can make solenoids stick."],
    causes: electrical
      ? ["Failed shift solenoid", "Damaged wiring or connector", "Transmission computer problem (less common)"]
      : ["Low, dirty, or wrong fluid", "Sticking shift solenoid", "Debris in the valve body", "Internal hydraulic problem"],
    dontReplace: electrical ? "The transmission or valve body. This is an electrical code, so test the solenoid circuit first." : "The whole transmission. Fluid condition and a sticking solenoid are common causes.",
    nextSteps: electrical ? ["Measure the solenoid's resistance at the transmission connector and compare it with the specification."] : ["Command the solenoid with a scan tool (where supported) and watch whether the shift follows.", "Have the fluid and filter serviced if the fluid is dirty, then retest."],
    urgency: "limit", urgencyNote: "If the transmission is stuck in one gear, avoid highway driving until it's checked.",
  };
}

// ---------- The library ----------

const mafChecks = [
  "Make sure the MAF sensor connector is fully plugged in and locked, with no corrosion or bent pins.",
  "Inspect the wiring from the sensor for chafing, melted insulation, or damage from recent work.",
];
const ectCompare = "With the engine cold (sitting overnight), compare the coolant temperature in live data with the intake air temperature. They should be close.";
const tpsReference = "Check the sensor's 5-volt reference and ground at the connector with the key on. Other sensors often share the same 5-volt reference, so a short in one can pull it down for all of them.";
const tpsNote = "On most newer vehicles with electronic throttle control, the throttle position sensor is built into the throttle body, so replacing the sensor means replacing the whole throttle body.";
const tpsUrgency = "If the engine goes into reduced-power mode or the throttle responds unpredictably, avoid driving until it's checked.";

export const codes: CodeInfo[] = [
  // Variable valve timing and cam/crank correlation
  camCircuit("P0010", "A", 1), camTiming("P0011", "A", 1, "advanced"), camTiming("P0012", "A", 1, "retarded"),
  camCircuit("P0013", "B", 1), camTiming("P0014", "B", 1, "advanced"), camTiming("P0015", "B", 1, "retarded"),
  correlation("P0016", 1, "A"), correlation("P0017", 1, "B"), correlation("P0018", 2, "A"), correlation("P0019", 2, "B"),
  camCircuit("P0020", "A", 2), camTiming("P0021", "A", 2, "advanced"), camTiming("P0022", "A", 2, "retarded"),

  // Fuel pressure
  {
    code: "P0087", title: "Fuel Rail/System Pressure – Too Low", system: "Fuel delivery",
    meaning: "The fuel pressure the computer measured is lower than it should be for the conditions. On direct-injection engines this can involve either the in-tank pump or the high-pressure pump on the engine.",
    symptoms: ["Hesitation or loss of power under load", "Hard starting or long cranking", "Stalling", "Reduced-power mode on some vehicles"],
    checkFirst: [LIVE_DATA, "Make sure there's enough fuel in the tank. Very low fuel can starve the pump on turns and hills.", "In live data, compare desired and actual fuel pressure at idle and under load.", "Check the fuel filter if your vehicle has a serviceable one."],
    causes: ["Weak in-tank fuel pump", "Clogged fuel filter or pump strainer", "Faulty pressure regulator", "High-pressure fuel pump problem (direct injection)", "Fuel pressure sensor reading incorrectly"],
    dontReplace: "The fuel pump. Confirm low pressure with a gauge or live data first. A clogged filter or a sensor problem gives the same code.",
    nextSteps: ["Test fuel pressure with a gauge (low-pressure side) and compare with the specification.", "On direct-injection engines, check both low-side and high-side pressure in live data."],
    urgency: "limit", urgencyNote: "Low fuel pressure can cause sudden power loss or stalling.",
  },

  // Mass airflow and manifold pressure
  sensorCode("P0100", "Mass or Volume Air Flow Circuit Malfunction", MAF, "circuit"),
  {
    code: "P0101", title: "Mass Air Flow (MAF) Circuit Range/Performance", system: "Air intake",
    meaning: "The computer compared the airflow reported by the mass airflow (MAF) sensor with what it expected from engine speed, throttle position, and other sensors, and they didn't agree. The sensor is working electrically, but its reading doesn't make sense for the conditions.",
    symptoms: ["Rough or unsteady idle", "Hesitation or stumbling when accelerating", "Lower fuel economy", "Often no noticeable change"],
    checkFirst: [
      LIVE_DATA,
      "Check the air filter and air box for a clog, water, or debris.",
      "Inspect the intake duct between the MAF sensor and the throttle body for cracks, loose clamps, or disconnected hoses. Air that sneaks in there isn't measured.",
      ...mafChecks,
      "In live data, compare the MAF reading (grams per second) at warm idle with the specification. As a rough guide, many engines read around 1 gram per second per liter of engine size at idle.",
    ],
    causes: ["Air leak after the MAF sensor", "Dirty or oil-contaminated MAF sensor", "Restricted air filter or intake", "Wiring or connector problem", "Failed MAF sensor"],
    dontReplace: "The MAF sensor. Air leaks and a dirty sensor often cause this code, and a new sensor won't fix a cracked intake boot.",
    nextSteps: ["Smoke-test the intake for leaks.", "Clean the MAF sensor with MAF-specific cleaner (not carb or brake cleaner) and recheck the readings."],
    urgency: "soon",
  },
  {
    code: "P0102", title: "Mass Air Flow (MAF) Circuit Low Input", system: "Air intake",
    meaning: "The signal from the mass airflow sensor is lower than it should ever be. That usually points to an electrical problem, like a missing signal, power, or ground, rather than to the airflow itself.",
    symptoms: ["Stalling soon after starting", "Rough running or hesitation", "Reduced power as the computer uses a backup value"],
    checkFirst: [...mafChecks, "Check the fuse that powers the MAF sensor.", "In live data, look at the MAF reading with the engine running. A reading near zero points to a missing signal."],
    causes: ["Unplugged or damaged connector", "Open or shorted signal wire", "Missing power supply or ground", "Blown fuse", "Failed MAF sensor"],
    dontReplace: "The MAF sensor. Check its power, ground, and signal wiring first.",
    nextSteps: ["Back-probe the connector and check for power and ground with the key on.", "Wiggle the wiring and connector while watching live data, and see whether the reading drops out."],
    urgency: "soon",
  },
  {
    code: "P0103", title: "Mass Air Flow (MAF) Circuit High Input", system: "Air intake",
    meaning: "The signal from the mass airflow sensor is higher than it should ever be. That usually points to an electrical problem, like a signal wire shorted to voltage or a poor ground.",
    symptoms: ["Rough running or hesitation", "Black smoke or poor fuel economy", "Reduced power as the computer uses a backup value"],
    checkFirst: [...mafChecks, "Look for aftermarket wiring or accessories spliced near the sensor circuit.", "In live data, check whether the MAF reading is high even at idle."],
    causes: ["Signal wire shorted to voltage", "Poor ground at the sensor", "Damaged connector", "Failed MAF sensor"],
    dontReplace: "The MAF sensor. A wiring short or bad ground gives the same code.",
    nextSteps: ["Check the sensor's ground with a voltage-drop test while the engine runs.", "Unplug the sensor and see whether the reading changes as expected."],
    urgency: "soon",
  },
  sensorCode("P0104", "Mass or Volume Air Flow Circuit Intermittent", MAF, "intermittent"),
  sensorCode("P0105", "Manifold Absolute Pressure/Barometric Pressure Circuit Malfunction", MAP, "circuit"),
  sensorCode("P0106", "Manifold Absolute Pressure/Barometric Pressure Circuit Range/Performance", MAP, "range"),
  sensorCode("P0107", "Manifold Absolute Pressure/Barometric Pressure Circuit Low Input", MAP, "low"),
  sensorCode("P0108", "Manifold Absolute Pressure/Barometric Pressure Circuit High Input", MAP, "high"),

  // Intake air temperature
  sensorCode("P0110", "Intake Air Temperature Circuit Malfunction", IAT, "circuit"),
  sensorCode("P0111", "Intake Air Temperature Circuit Range/Performance", IAT, "range"),
  sensorCode("P0112", "Intake Air Temperature Circuit Low Input", IAT, "low"),
  sensorCode("P0113", "Intake Air Temperature Circuit High Input", IAT, "high"),

  // Coolant temperature
  sensorCode("P0115", "Engine Coolant Temperature Circuit Malfunction", ECT, "circuit"),
  sensorCode("P0116", "Engine Coolant Temperature Circuit Range/Performance", ECT, "range"),
  {
    code: "P0117", title: "Engine Coolant Temperature Circuit Low Input", system: "Engine cooling",
    meaning: "The coolant temperature sensor signal is lower than normal. On most vehicles that makes the computer think the engine is extremely hot. It's usually an electrical short, not real overheating, but check that first.",
    symptoms: ["Cooling fans running all the time", "Hard starting when cold", "Poor fuel economy or black smoke", "Temperature gauge reading wrong on some vehicles"],
    checkFirst: [
      "With the engine cool, check the coolant level, and make sure the engine isn't actually overheating.",
      ectCompare,
      "Inspect the sensor connector and wiring for chafing that could short the signal to ground.",
      "Unplug the sensor with the key on. The reading should drop to its coldest value (often -40°). If it does, the short is in the sensor, not the wiring.",
    ],
    causes: ["Shorted coolant temperature sensor", "Signal wire shorted to ground", "Damaged connector"],
    dontReplace: "The sensor is cheap, but check the wiring before replacing it. And never ignore a gauge that shows real overheating.",
    nextSteps: ["Measure the sensor's resistance and compare it with the temperature chart for your engine."],
    urgency: "soon", urgencyNote: "If the temperature gauge or a warning light shows real overheating, stop driving.",
  },
  {
    code: "P0118", title: "Engine Coolant Temperature Circuit High Input", system: "Engine cooling",
    meaning: "The coolant temperature sensor signal is higher than normal. On most vehicles that makes the computer think the engine is extremely cold. It's often an open circuit, such as an unplugged connector or a broken wire.",
    symptoms: ["Cooling fans running all the time (a common backup mode)", "Hard starting when warm", "Poor fuel economy", "Temperature gauge reading low or not moving"],
    checkFirst: [
      "Check that the sensor connector is fully plugged in and not corroded. It's easy to miss after cooling-system work.",
      "Inspect the wiring for breaks.",
      "In live data, a reading stuck at the coldest value (often -40°) points to an open circuit.",
      "With the sensor unplugged, briefly jumper the two connector terminals. The reading should jump to very hot, which proves the wiring and computer can see the circuit.",
    ],
    causes: ["Unplugged or corroded connector", "Broken signal or ground wire", "Failed coolant temperature sensor"],
    dontReplace: "The sensor. A loose or corroded connector is a common cause.",
    nextSteps: ["Measure the sensor's resistance and compare it with the temperature chart for your engine."],
    urgency: "soon",
  },
  sensorCode("P0119", "Engine Coolant Temperature Circuit Intermittent", ECT, "intermittent"),

  // Throttle / pedal position
  sensorCode("P0120", "Throttle/Pedal Position Sensor/Switch A Circuit Malfunction", TPS_A, "circuit"),
  {
    code: "P0121", title: "Throttle/Pedal Position Sensor A Circuit Range/Performance", system: "Throttle control",
    meaning: "The throttle position sensor reading doesn't agree with what the computer expects from airflow and other signals, or it's jumping around. The sensor is reporting, but the reading doesn't make sense.",
    symptoms: ["Hesitation or surging", "Unsteady idle", "Rough or odd shifting on automatics", "Reduced-power mode on vehicles with electronic throttle"],
    checkFirst: [
      LIVE_DATA,
      "Inspect the sensor connector and wiring for corrosion or looseness.",
      "With the key on and engine off, slowly press the pedal (or open the throttle by hand on cable-throttle engines) while watching the throttle position in live data. It should rise and fall smoothly with no jumps or dropouts.",
      "Look for heavy carbon buildup in the throttle body and for vacuum leaks, which can make the readings disagree.",
    ],
    causes: ["Worn sensor with a dead spot", "Intermittent connector or wiring", "Dirty throttle body", "Air leak", "Electronic throttle body fault"],
    dontReplace: `The throttle position sensor. ${tpsNote} Confirm the fault with live data and wiring checks first.`,
    nextSteps: ["Graph the sensor signal and look for dropouts.", "Wiggle the wiring while watching live data."],
    urgency: "limit", urgencyNote: tpsUrgency,
  },
  {
    code: "P0122", title: "Throttle/Pedal Position Sensor A Circuit Low Input", system: "Throttle control",
    meaning: "The throttle position sensor signal is lower than it should ever be. That usually points to a broken signal wire, a missing 5-volt reference, or a short to ground.",
    symptoms: ["Reduced-power mode", "Hesitation or poor acceleration", "High or unsteady idle", "Shifting problems on automatics"],
    checkFirst: [LIVE_DATA, "Inspect the connector and wiring for damage or corrosion.", tpsReference, "In live data, see whether the throttle reading sits at or near zero."],
    causes: ["Open or shorted signal wire", "Lost 5-volt reference (sometimes from another shorted sensor)", "Bad connector", "Failed sensor or throttle body"],
    dontReplace: `The throttle body. ${tpsNote}`,
    nextSteps: ["If several sensor codes appeared together, unplug other sensors on the same 5-volt reference one at a time to find a short."],
    urgency: "limit", urgencyNote: tpsUrgency,
  },
  {
    code: "P0123", title: "Throttle/Pedal Position Sensor A Circuit High Input", system: "Throttle control",
    meaning: "The throttle position sensor signal is higher than it should ever be. That usually points to a poor ground or a signal wire shorted to voltage.",
    symptoms: ["Reduced-power mode", "High idle", "Hesitation or surging", "Shifting problems on automatics"],
    checkFirst: [LIVE_DATA, "Inspect the connector and wiring for damage or corrosion.", "Check the sensor's ground circuit. A poor ground often pushes the signal high.", "In live data, see whether the throttle reading is high even with your foot off the pedal."],
    causes: ["Open or poor ground", "Signal wire shorted to voltage", "Bad connector", "Failed sensor or throttle body"],
    dontReplace: `The throttle body. ${tpsNote}`,
    nextSteps: ["Do a voltage-drop test on the sensor ground.", "Measure the signal voltage at closed and wide-open throttle and compare it with the specification."],
    urgency: "limit", urgencyNote: tpsUrgency,
  },
  sensorCode("P0124", "Throttle/Pedal Position Sensor/Switch A Circuit Intermittent", TPS_A, "intermittent"),
  sensorCode("P0220", "Throttle/Pedal Position Sensor/Switch B Circuit Malfunction", TPS_B, "circuit"),
  sensorCode("P0221", "Throttle/Pedal Position Sensor/Switch B Circuit Range/Performance", TPS_B, "range"),
  sensorCode("P0222", "Throttle/Pedal Position Sensor/Switch B Circuit Low Input", TPS_B, "low"),
  sensorCode("P0223", "Throttle/Pedal Position Sensor/Switch B Circuit High Input", TPS_B, "high"),

  // Warm-up
  {
    code: "P0125", title: "Insufficient Coolant Temperature for Closed Loop Fuel Control", system: "Engine cooling",
    meaning: "The engine took too long to get warm enough for the computer to start fine-tuning the fuel mixture with the oxygen sensors (called closed loop).",
    symptoms: ["Heater slow to warm up", "Temperature gauge reading lower than normal", "Lower fuel economy", "Often nothing else"],
    checkFirst: ["Check the coolant level with the engine cool.", "From a cold start, watch coolant temperature in live data. It should rise steadily without stalling partway.", "Feel the upper radiator hose while the engine warms up. If it gets hot right away, the thermostat may be stuck open.", "Check whether the cooling fan runs all the time, even on a cold engine."],
    causes: ["Thermostat stuck open", "Low coolant", "Coolant temperature sensor reading low", "Cooling fan running constantly", "Long idling in very cold weather"],
    dontReplace: "The oxygen sensors. They're waiting on the engine to warm up; the cause is usually the thermostat or the temperature reading.",
    nextSteps: ["Compare the scan-tool temperature with an infrared thermometer reading at the thermostat housing."],
    urgency: "low",
  },
  {
    code: "P0128", title: "Coolant Thermostat (Coolant Temperature Below Regulating Temperature)", system: "Engine cooling",
    meaning: "The engine took too long to warm up, or never reached its normal operating temperature. The computer expected the coolant to get warmer in the time it was driven.",
    symptoms: ["Heater blowing cooler than usual", "Temperature gauge reading lower than normal", "Lower fuel economy", "Often nothing else"],
    checkFirst: [
      "Check the coolant level with the engine cool.",
      "From a cold start, watch the coolant temperature in live data. It should rise steadily to the normal range, often around 195–220°F (90–105°C).",
      "Feel the upper radiator hose while the engine warms up. If it gets hot right away, the thermostat may be stuck open.",
      "Check whether the cooling fan runs all the time, even on a cold engine.",
    ],
    causes: ["Thermostat stuck open", "Cooling fan running constantly", "Low coolant", "Coolant temperature sensor reading low", "Long idling in very cold weather"],
    dontReplace: "The coolant temperature sensor. A stuck-open thermostat is the more common cause. Confirm with the warm-up data.",
    nextSteps: ["Compare the scan-tool temperature with an infrared thermometer reading at the thermostat housing."],
    urgency: "low",
  },

  // Oxygen sensors
  o2("P0130", 1, 1, "circuit"), o2("P0131", 1, 1, "low"), o2("P0132", 1, 1, "high"), o2("P0133", 1, 1, "slow"), o2("P0134", 1, 1, "none"), o2("P0135", 1, 1, "heater"),
  o2("P0136", 1, 2, "circuit"), o2("P0137", 1, 2, "low"), o2("P0138", 1, 2, "high"), o2("P0139", 1, 2, "slow"), o2("P0140", 1, 2, "none"), o2("P0141", 1, 2, "heater"),
  o2("P0150", 2, 1, "circuit"), o2("P0151", 2, 1, "low"), o2("P0152", 2, 1, "high"), o2("P0153", 2, 1, "slow"), o2("P0154", 2, 1, "none"), o2("P0155", 2, 1, "heater"),
  o2("P0156", 2, 2, "circuit"), o2("P0157", 2, 2, "low"), o2("P0158", 2, 2, "high"), o2("P0159", 2, 2, "slow"), o2("P0160", 2, 2, "none"), o2("P0161", 2, 2, "heater"),

  // Fuel mixture
  trim("P0170", 1), lean("P0171", 1), rich("P0172", 1), trim("P0173", 2), lean("P0174", 2), rich("P0175", 2),

  // Fuel injectors and pump
  {
    code: "P0200", title: "Injector Circuit Malfunction", system: "Fuel injection",
    meaning: "The computer found an electrical problem in a fuel injector circuit, without naming a single cylinder. On some vehicles it points to a shared injector power supply or driver.",
    symptoms: ["Misfire or rough running", "Hard starting", "Loss of power"],
    checkFirst: [LIVE_DATA, "Check the fuse or relay that powers the injectors.", "Inspect the injector wiring harness and connectors for damage or corrosion.", "Check for cylinder-specific misfire or injector codes that narrow it down."],
    causes: ["Injector power supply problem (fuse or relay)", "Damaged injector harness", "Failed injector", "Injector driver in the engine computer (uncommon)"],
    dontReplace: "All the injectors. Look for a shared power or wiring problem first.",
    nextSteps: ["Check for power at each injector connector with the key on, and use a noid light to confirm the computer is switching them."],
    urgency: "limit", urgencyNote: MISFIRE_NOTE,
  },
  injector(1), injector(2), injector(3), injector(4), injector(5), injector(6), injector(7), injector(8),
  {
    code: "P0230", title: "Fuel Pump Primary Circuit Malfunction", system: "Fuel delivery",
    meaning: "The computer found an electrical problem in the circuit that turns the fuel pump on, usually the relay control side or the pump's power feed.",
    symptoms: ["Engine cranks but won't start", "Stalling", "Hesitation or loss of power", "Sometimes no noticeable change"],
    checkFirst: [LIVE_DATA, "Listen for the fuel pump running for a couple of seconds when you turn the key on.", "Check the fuel pump fuse and relay. Swapping the relay with an identical one is a quick test.", "Inspect the wiring and connectors to the pump relay (and pump control module, if your vehicle has one)."],
    causes: ["Failed fuel pump relay", "Blown fuse", "Damaged wiring or connector", "Fuel pump control module problem (on some vehicles)", "Failed fuel pump drawing too much current"],
    dontReplace: "The fuel pump. This code is about the control circuit. A relay, fuse, or wiring problem is a common cause.",
    nextSteps: ["Check for power and ground at the pump connector while the pump should be running.", "Test fuel pressure if the pump runs."],
    urgency: "limit", urgencyNote: "A fuel pump circuit problem can make the engine stall without warning.",
  },

  // Misfires
  {
    code: "P0300", title: "Random/Multiple Cylinder Misfire Detected", system: "Ignition and misfire",
    meaning: "The computer detected misfires that aren't limited to one cylinder. They're happening in more than one cylinder, or moving around.",
    symptoms: ["Rough running or shaking", "Hesitation or loss of power", "A flashing check-engine light during a severe misfire"],
    checkFirst: [
      "Notice whether the check-engine light flashes. A flashing light means a severe misfire.",
      LIVE_DATA,
      "In live data, look at the misfire counters to see which cylinders are misfiring and when.",
      "Look for vacuum leaks and check fuel trims. A lean mixture can cause misfires across several cylinders.",
      "Check the condition and age of the spark plugs.",
      "Check fuel pressure if the misfires happen under load.",
    ],
    causes: ["Vacuum leak or lean mixture", "Worn spark plugs", "Weak fuel pressure or dirty injectors", "One or more failing ignition coils", "EGR flow problem", "Mechanical problem such as low compression or jumped timing"],
    dontReplace: "All the ignition coils or injectors. Misfires in several cylinders usually have a shared cause, like a vacuum leak, fuel delivery, or worn plugs.",
    nextSteps: ["If the counters point to one or two cylinders, follow the single-cylinder checks (swap coils and plugs).", "If fuel trims are high, smoke-test for vacuum leaks and test fuel pressure.", "If everything else checks out, do a compression test."],
    urgency: "limit", urgencyNote: MISFIRE_NOTE,
  },
  misfire(1), misfire(2), misfire(3), misfire(4), misfire(5), misfire(6), misfire(7), misfire(8),
  {
    code: "P0316", title: "Engine Misfire Detected on Startup (First 1000 Revolutions)", system: "Ignition and misfire",
    meaning: "The computer detected misfiring during the first moments after the engine started. Problems that only show up at startup often involve fuel, moisture, or coolant getting where it shouldn't.",
    symptoms: ["Rough running right after starting that smooths out", "Hard starting", "White smoke at startup (sometimes)"],
    checkFirst: [LIVE_DATA, "Check for other misfire codes that point to specific cylinders.", "Check the coolant level. If it keeps dropping with no visible leak, coolant may be getting into a cylinder.", "Look for moisture or oil in the spark plug wells and coils.", "Check fuel pressure, and whether it holds after the engine is shut off."],
    causes: ["Leaking fuel injector flooding a cylinder overnight", "Fuel pressure dropping while parked", "Moisture in coils or plug wells", "Worn spark plugs", "Coolant leaking into a cylinder (head or intake gasket)"],
    dontReplace: "The ignition coils. Startup-only misfires often come from fuel or coolant issues, so check those first.",
    nextSteps: ["Pull the spark plugs and look for one that's wet, fuel-fouled, or unusually clean (a sign of coolant).", "If coolant loss is suspected, have a cooling-system pressure test or combustion-gas test done."],
    urgency: "soon", urgencyNote: "If coolant is disappearing or you see white smoke, get it checked promptly to avoid engine damage.",
  },

  // Knock sensors
  sensorCode("P0325", "Knock Sensor 1 Circuit Malfunction (Bank 1 or Single Sensor)", KNOCK(1), "circuit"),
  sensorCode("P0327", "Knock Sensor 1 Circuit Low Input (Bank 1 or Single Sensor)", KNOCK(1), "low"),
  sensorCode("P0328", "Knock Sensor 1 Circuit High Input (Bank 1 or Single Sensor)", KNOCK(1), "high"),
  sensorCode("P0330", "Knock Sensor 2 Circuit Malfunction (Bank 2)", KNOCK(2), "circuit"),
  sensorCode("P0332", "Knock Sensor 2 Circuit Low Input (Bank 2)", KNOCK(2), "low"),

  // Crankshaft / camshaft position
  {
    code: "P0335", title: "Crankshaft Position Sensor A Circuit", system: "Engine timing",
    meaning: "The computer isn't getting a usable signal from the crankshaft position sensor, which tells it engine speed and position. Without it, the engine may not run.",
    symptoms: ["Engine cranks but won't start", "Stalling, especially when warm", "Tachometer dropping out", "Rough running"],
    checkFirst: [
      "Inspect the sensor connector and wiring. It often runs near hot or moving parts.",
      "Watch the rpm reading in live data while cranking. Zero rpm while the engine turns over points to a missing crank signal.",
      "Check that the sensor is mounted securely, and look for metal debris on its tip.",
      "Check the sensor's power supply and ground if it's a powered (Hall-effect) type.",
    ],
    causes: ["Failed sensor (often heat-related)", "Damaged wiring or connector", "Damaged tone ring (reluctor)", "Incorrect sensor gap"],
    dontReplace: "The crank sensor does fail, but a damaged wire, a loose connector, or a damaged tone ring gives the same code. Check the wiring and signal first.",
    nextSteps: ["Check the sensor signal with an oscilloscope or a meter while cranking.", "Wiggle-test the wiring while the engine idles."],
    urgency: "limit", urgencyNote: "This problem can make the engine stall without warning while driving.",
  },
  sensorCode("P0336", "Crankshaft Position Sensor A Circuit Range/Performance", CKP, "range"),
  sensorCode("P0337", "Crankshaft Position Sensor A Circuit Low Input", CKP, "low"),
  sensorCode("P0338", "Crankshaft Position Sensor A Circuit High Input", CKP, "high"),
  sensorCode("P0339", "Crankshaft Position Sensor A Circuit Intermittent", CKP, "intermittent"),
  {
    code: "P0340", title: "Camshaft Position Sensor A Circuit (Bank 1 or Single Sensor)", system: "Engine timing",
    meaning: "The computer isn't getting a usable signal from the camshaft position sensor, which helps it time fuel and spark.",
    symptoms: ["Long cranking or hard starting", "Stalling", "Rough running or reduced power"],
    checkFirst: [LIVE_DATA, "Inspect the sensor connector and wiring for damage or oil in the connector.", "Check the sensor's power supply and ground with the key on."],
    causes: ["Failed camshaft sensor", "Damaged wiring or connector", "Damaged tone ring", "Timing belt or chain problem"],
    dontReplace: "The camshaft sensor. If cam/crank correlation codes (like P0016) are also set, the real problem may be timing chain wear or a jumped belt.",
    nextSteps: ["Check the sensor signal with an oscilloscope or meter.", "If timing is suspected, have the timing marks checked."],
    urgency: "limit", urgencyNote: "This problem can cause stalling or no-start conditions.",
  },
  sensorCode("P0341", "Camshaft Position Sensor A Circuit Range/Performance (Bank 1 or Single Sensor)", CMP(1), "range"),
  sensorCode("P0342", "Camshaft Position Sensor A Circuit Low Input (Bank 1 or Single Sensor)", CMP(1), "low"),
  sensorCode("P0343", "Camshaft Position Sensor A Circuit High Input (Bank 1 or Single Sensor)", CMP(1), "high"),
  sensorCode("P0345", "Camshaft Position Sensor A Circuit (Bank 2)", CMP(2), "circuit"),

  // Ignition coils
  coil("A", 1), coil("B", 2), coil("C", 3), coil("D", 4), coil("E", 5), coil("F", 6), coil("G", 7), coil("H", 8),

  // EGR
  {
    code: "P0400", title: "Exhaust Gas Recirculation Flow Malfunction", system: "Exhaust gas recirculation (EGR)",
    meaning: "The EGR system feeds a small amount of exhaust back into the engine to lower combustion temperatures. The computer found that EGR flow isn't what it expected, without saying whether it's too much or too little.",
    symptoms: ["Pinging or knocking under load", "Rough idle or stalling (sometimes)", "Often no noticeable change"],
    checkFirst: [LIVE_DATA, "Inspect the EGR valve connector, wiring, and any vacuum hoses to it.", "Check for carbon buildup at the EGR valve and its passages, a very common cause on higher-mileage engines."],
    causes: ["Carbon-clogged EGR valve or passages", "EGR valve stuck open or closed", "Vacuum supply or control problem", "EGR sensor or wiring problem"],
    dontReplace: "The EGR valve. Clogged passages are common and a new valve won't clear them.",
    nextSteps: ["Command the EGR valve with a scan tool (where supported) and watch for an rpm drop at idle, which shows exhaust is flowing."],
    urgency: "low",
  },
  {
    code: "P0401", title: "Exhaust Gas Recirculation Flow Insufficient Detected", system: "Exhaust gas recirculation (EGR)",
    meaning: "The computer commanded EGR flow but didn't see enough of it. Exhaust isn't getting back into the engine as expected.",
    symptoms: ["Pinging or knocking under load", "Often no noticeable change"],
    checkFirst: [LIVE_DATA, "Check for carbon buildup at the EGR valve and in its passages to the intake.", "Inspect vacuum hoses and any EGR pressure sensor hoses for cracks, plugging, or misrouting.", "Inspect the EGR valve connector and wiring."],
    causes: ["Carbon-clogged EGR passages", "EGR valve stuck closed", "Cracked or plugged vacuum or sensor hoses", "EGR flow or pressure sensor problem"],
    dontReplace: "The EGR valve. Clogged passages and cracked hoses are common causes.",
    nextSteps: ["Command the EGR valve open at idle (where supported). The idle should roughen or drop if exhaust is flowing.", "Clean the EGR passages if they're restricted, then retest."],
    urgency: "low",
  },
  {
    code: "P0402", title: "Exhaust Gas Recirculation Flow Excessive Detected", system: "Exhaust gas recirculation (EGR)",
    meaning: "The computer saw more EGR flow than it commanded. Exhaust may be getting into the engine at idle or when it shouldn't.",
    symptoms: ["Rough idle", "Stalling, especially when coming to a stop", "Hesitation"],
    checkFirst: [LIVE_DATA, "Check whether the EGR valve is stuck open with carbon.", "Inspect vacuum hoses to the EGR valve for misrouting (some older systems).", "Inspect the EGR valve connector and wiring."],
    causes: ["EGR valve stuck open", "Carbon holding the valve off its seat", "Vacuum control problem", "EGR sensor problem"],
    dontReplace: "The EGR valve can be the cause here, but cleaning carbon off it sometimes fixes it. Check the control side first.",
    nextSteps: ["Watch EGR position in live data at idle. It should read closed."],
    urgency: "soon", urgencyNote: "Stalling at stops can be a safety concern in traffic.",
  },
  {
    code: "P0403", title: "Exhaust Gas Recirculation Circuit Malfunction", system: "Exhaust gas recirculation (EGR)",
    meaning: "The computer found an electrical problem in the circuit that controls the EGR valve or its control solenoid.",
    symptoms: ["Often no noticeable change", "Pinging under load", "Rough idle (sometimes)"],
    checkFirst: [LIVE_DATA, "Inspect the EGR valve or solenoid connector and wiring.", "Measure the valve or solenoid resistance and compare it with the specification."],
    causes: ["Failed EGR valve or solenoid (electrical)", "Damaged wiring or connector", "Blown fuse or power supply problem"],
    dontReplace: "The engine computer. Check the valve and its wiring first.",
    nextSteps: ["Check for power and ground at the connector against the wiring diagram."],
    urgency: "low",
  },
  {
    code: "P0404", title: "Exhaust Gas Recirculation Circuit Range/Performance", system: "Exhaust gas recirculation (EGR)",
    meaning: "The EGR valve's actual position doesn't match what the computer commanded, or it's responding too slowly.",
    symptoms: ["Rough idle", "Hesitation", "Often no noticeable change"],
    checkFirst: [LIVE_DATA, "Check the EGR valve for carbon that could keep it from moving freely.", "Inspect the valve connector and wiring.", "In live data, compare commanded and actual EGR position."],
    causes: ["Carbon buildup on the EGR valve", "Sticking EGR valve", "Position sensor problem", "Wiring problem"],
    dontReplace: "The EGR valve. Carbon buildup is a common cause and can often be cleaned.",
    nextSteps: ["Command the valve through its range with a scan tool (where supported) and watch whether actual position follows."],
    urgency: "low",
  },
  sensorCode("P0405", "Exhaust Gas Recirculation Sensor A Circuit Low", EGR_SENSOR, "low"),
  sensorCode("P0406", "Exhaust Gas Recirculation Sensor A Circuit High", EGR_SENSOR, "high"),

  // Secondary air
  {
    code: "P0410", title: "Secondary Air Injection System Malfunction", system: "Secondary air injection",
    meaning: "Some engines pump fresh air into the exhaust for a short time after a cold start to help the catalytic converter warm up. The computer found a problem with that system.",
    symptoms: ["Usually none besides the check-engine light", "A loud or unusual whine from the air pump at cold start (sometimes)", "Air pump not running at all"],
    checkFirst: [LIVE_DATA, "Listen for the air pump running for a short time after a cold start.", "Check the air pump fuse and relay.", "Inspect the air pump hoses and check valves for cracks, melting, or moisture."],
    causes: ["Failed air pump (often from moisture)", "Stuck or leaking check valve", "Blown fuse or failed relay", "Cracked hoses", "Wiring problem"],
    dontReplace: "The air pump. A fuse, relay, or stuck check valve is often the cause.",
    nextSteps: ["Command the air pump on with a scan tool (where supported) and check for airflow at the pump outlet."],
    urgency: "low",
  },
  {
    code: "P0411", title: "Secondary Air Injection System Incorrect Flow Detected", system: "Secondary air injection",
    meaning: "The computer expected the secondary air system to add fresh air to the exhaust after a cold start, but the oxygen sensor readings showed the flow wasn't right.",
    symptoms: ["Usually none besides the check-engine light"],
    checkFirst: [LIVE_DATA, "Listen for the air pump running for a short time after a cold start.", "Inspect hoses and check valves for leaks, blockage, or moisture.", "Check for carbon or corrosion blocking the air passages into the exhaust."],
    causes: ["Weak or failed air pump", "Stuck check valve or switching valve", "Blocked air passages", "Cracked hoses"],
    dontReplace: "The air pump. Check valves and blocked passages are common causes.",
    nextSteps: ["Watch the upstream oxygen sensor during a cold start. It should read lean while the air pump runs."],
    urgency: "low",
  },

  // Catalytic converter
  catalyst("P0420", 1), catalyst("P0430", 2),

  // EVAP
  {
    code: "P0440", title: "Evaporative Emission System Malfunction", system: "Evaporative emissions (EVAP)",
    meaning: "The computer found a general problem in the EVAP system, which traps fuel vapor from the tank. The code doesn't say which part.",
    symptoms: ["Usually none besides the check-engine light", "A faint fuel smell (sometimes)"],
    checkFirst: [capCheck, evapHoses, LIVE_DATA],
    causes: ["Loose or faulty gas cap", "EVAP leak", "Purge or vent valve problem", "Wiring or connector problem"],
    dontReplace: "The charcoal canister. Start with the gas cap and hoses.",
    nextSteps: ["Have the EVAP system smoke-tested.", evapClear],
    urgency: "low",
  },
  {
    code: "P0441", title: "Evaporative Emission System Incorrect Purge Flow", system: "Evaporative emissions (EVAP)",
    meaning: "The purge valve lets stored fuel vapor into the engine to be burned. The computer found the flow isn't what it expected: too much, too little, or at the wrong time.",
    symptoms: ["Usually none besides the check-engine light", "Hard starting right after refueling (if the purge valve sticks open)", "Rough idle (sometimes)"],
    checkFirst: [LIVE_DATA, evapHoses, "Check whether the purge valve seals when it's unpowered, and opens when commanded with a scan tool.", "Check the purge valve connector and wiring."],
    causes: ["Purge valve stuck open or closed", "Cracked or blocked purge hose", "Wiring problem", "Blocked canister"],
    dontReplace: "The charcoal canister. The purge valve and its hoses are more common causes.",
    nextSteps: ["Command the purge valve on and off with a scan tool and check for vacuum at the canister side.", evapClear],
    urgency: "low",
  },
  evapLeak("P0442", "Evaporative Emission System Leak Detected (Small Leak)", "small leak"),
  evapValveCircuit("P0443", "Evaporative Emission System Purge Control Valve Circuit Malfunction", "purge"),
  {
    code: "P0446", title: "Evaporative Emission System Vent Control Circuit", system: "Evaporative emissions (EVAP)",
    meaning: "The vent valve lets fresh air in and out of the EVAP system and closes during the leak test. The computer found a problem with the valve or its circuit.",
    symptoms: ["Usually none besides the check-engine light", "The fuel pump nozzle clicking off early when refueling (sometimes)"],
    checkFirst: [LIVE_DATA, "Inspect the vent valve (usually near the charcoal canister or fuel tank) and its connector for dirt, water, or corrosion.", "Check the vent filter or vent hose for blockage from dirt or insects."],
    causes: ["Failed vent valve", "Blocked vent filter or hose", "Wiring or connector problem"],
    dontReplace: "The charcoal canister. The vent valve and its wiring are more common causes.",
    nextSteps: ["Command the vent valve closed and open with a scan tool and listen for it clicking.", evapClear],
    urgency: "low",
  },
  evapValveCircuit("P0449", "Evaporative Emission System Vent Valve/Solenoid Circuit Malfunction", "vent"),
  sensorCode("P0451", "Evaporative Emission System Pressure Sensor Range/Performance", EVAP_SENSOR, "range"),
  sensorCode("P0452", "Evaporative Emission System Pressure Sensor Low Input", EVAP_SENSOR, "low"),
  sensorCode("P0453", "Evaporative Emission System Pressure Sensor High Input", EVAP_SENSOR, "high"),
  evapLeak("P0455", "Evaporative Emission System Leak Detected (Large Leak)", "large leak, or couldn't build any vacuum at all", "If you smell raw fuel, have it checked promptly."),
  evapLeak("P0456", "Evaporative Emission System Leak Detected (Very Small Leak)", "very small leak"),
  {
    ...evapLeak("P0457", "Evaporative Emission System Leak Detected (Fuel Cap Loose/Off)", "leak that looks like a loose or missing gas cap"),
    meaning: "The EVAP system traps fuel vapor from the tank instead of letting it escape. During its self-test, the computer found a leak that most often comes from a loose, missing, or poorly sealing gas cap.",
    checkFirst: ["Make sure the gas cap is on and tightened until it clicks.", "Look at the cap's rubber seal for cracks, tears, or dirt.", "Inspect the filler neck for rust or damage where the cap seals.", evapHoses],
    dontReplace: "Anything but the gas cap, at first. Tighten or replace the cap, then give the system time to recheck.",
  },

  // Vehicle speed and idle
  {
    code: "P0500", title: "Vehicle Speed Sensor A Malfunction", system: "Vehicle speed",
    meaning: "The computer isn't getting a believable vehicle speed signal. Speed information feeds the speedometer, shifting, cruise control, and more.",
    symptoms: ["Speedometer erratic or not working", "Harsh or odd shifting on automatics", "Cruise control not working", "ABS or traction light on some vehicles"],
    checkFirst: [
      "Notice whether the speedometer works.",
      "Check for ABS wheel speed codes too. Many vehicles get vehicle speed from the ABS system.",
      "Inspect the speed sensor connector and wiring (often on the transmission or at a wheel).",
      "Compare the speed in live data with actual speed on a test drive.",
    ],
    causes: ["Failed speed sensor", "Damaged wiring or connector", "Metal debris on a magnetic sensor tip", "ABS wheel speed sensor or module problem", "Instrument cluster or network problem"],
    dontReplace: "The vehicle speed sensor. On many vehicles, speed comes from the ABS wheel speed sensors, so the fault may be elsewhere.",
    nextSteps: ["Find where your vehicle gets its speed signal from, then test that sensor's signal and wiring."],
    urgency: "soon", urgencyNote: "Shifting and some safety systems may be affected.",
  },
  sensorCode("P0501", "Vehicle Speed Sensor A Range/Performance", VSS, "range"),
  sensorCode("P0502", "Vehicle Speed Sensor A Circuit Low Input", VSS, "low"),
  sensorCode("P0503", "Vehicle Speed Sensor A Intermittent/Erratic/High", VSS, "intermittent"),
  {
    code: "P0505", title: "Idle Air Control System Malfunction", system: "Idle control",
    meaning: "The computer controls idle speed by letting a measured amount of air past the throttle, using an idle air control valve or the electronic throttle. It found that idle control isn't working as expected.",
    symptoms: ["Idle too high, too low, or hunting up and down", "Stalling, especially when coming to a stop", "Hard starting"],
    checkFirst: [LIVE_DATA, "Look for vacuum leaks, which can raise idle beyond what the computer can control.", "Check the throttle body and idle air passages for carbon buildup.", "Inspect the idle air control valve (if equipped) connector and wiring."],
    causes: ["Carbon buildup in the throttle body or idle passages", "Vacuum leak", "Failed idle air control valve (older vehicles)", "Electronic throttle body problem", "Wiring or connector problem"],
    dontReplace: "The idle air control valve or throttle body. Cleaning carbon and fixing vacuum leaks solves many idle problems.",
    nextSteps: ["After cleaning the throttle body, check whether your vehicle needs an idle relearn procedure. Some do after cleaning or a battery disconnect."],
    urgency: "soon", urgencyNote: "Stalling at stops can be a safety concern in traffic.",
  },
  {
    code: "P0506", title: "Idle Air Control System RPM Lower Than Expected", system: "Idle control",
    meaning: "The computer tried to hold a target idle speed, but the engine idled lower than it wanted, even after the computer opened up the idle air as far as it could.",
    symptoms: ["Low or rough idle", "Stalling, especially with the A/C on or when coming to a stop", "Vibration at idle"],
    checkFirst: [LIVE_DATA, "Check the throttle body and idle air passages for carbon buildup that restricts airflow.", "Check the air filter for a restriction.", "Notice whether heavy loads (A/C, power steering at full lock, headlights) make it worse."],
    causes: ["Carbon buildup in the throttle body", "Restricted air filter or intake", "Sticking idle air control valve (older vehicles)", "Engine running poorly for another reason (misfire, low compression)"],
    dontReplace: "The throttle body. A carbon-restricted throttle body can often be cleaned.",
    nextSteps: ["Clean the throttle body and run any idle relearn your vehicle needs, then retest."],
    urgency: "soon", urgencyNote: "Stalling at stops can be a safety concern in traffic.",
  },
  {
    code: "P0507", title: "Idle Air Control System RPM Higher Than Expected", system: "Idle control",
    meaning: "The computer tried to hold a target idle speed, but the engine idled higher than it wanted, even after the computer closed down the idle air as far as it could. Extra air is getting in somewhere.",
    symptoms: ["High idle", "Idle that surges or hunts", "Harder engagement when shifting into gear"],
    checkFirst: [LIVE_DATA, "Look for vacuum leaks: cracked hoses, the PCV system, the brake booster hose, and intake gaskets.", "Check that the throttle isn't being held open by a sticking cable, floor mat, or carbon.", "Check whether the idle is high only when the engine is cold (which can be normal) or also when warm."],
    causes: ["Vacuum leak", "Throttle not fully closing", "Sticking idle air control valve (older vehicles)", "Electronic throttle body problem"],
    dontReplace: "The idle air control valve or throttle body. A vacuum leak is the most common cause.",
    nextSteps: ["Smoke-test the intake for leaks.", "Check whether your vehicle needs an idle relearn after any throttle work."],
    urgency: "low",
  },

  // Charging voltage
  {
    code: "P0562", title: "System Voltage Low", system: "Charging system",
    meaning: "The engine computer saw its supply voltage drop below the normal range. The problem is usually the battery, the charging system, or a poor connection, not the computer itself.",
    symptoms: ["Dim lights or slow cranking", "Battery or charging light on", "Other warning lights or odd electrical behavior", "Stalling (in severe cases)"],
    checkFirst: [LIVE_DATA, "Check the battery terminals and cables for looseness or corrosion, including the ground connections to the engine and body.", "With the engine running, measure voltage at the battery. Most charging systems hold around 13.5 to 14.8 volts.", "Check the alternator drive belt for wear or slipping."],
    causes: ["Weak or failing battery", "Alternator not charging properly", "Loose or corroded battery or ground connections", "Slipping drive belt", "Wiring problem to the engine computer's power feed"],
    dontReplace: "The alternator or the engine computer. Loose connections and a weak battery are common causes. Test the battery and charging output first.",
    nextSteps: ["Have the battery load-tested and the charging system tested.", "Do a voltage-drop test on the main power and ground cables."],
    urgency: "soon", urgencyNote: "Low charging voltage can leave you with a dead battery or a stall.",
  },
  {
    code: "P0563", title: "System Voltage High", system: "Charging system",
    meaning: "The engine computer saw its supply voltage rise above the normal range. The charging system may be overcharging.",
    symptoms: ["Very bright or flickering lights", "Battery or charging light on", "Bulbs burning out often", "Battery smell or swelling (in severe cases)"],
    checkFirst: [LIVE_DATA, "With the engine running, measure voltage at the battery. Readings well above about 15 volts suggest overcharging.", "Check the battery terminals and ground connections. A poor connection can confuse some voltage regulators.", "Check whether a jump-starter or battery charger was connected recently."],
    causes: ["Faulty voltage regulator (often inside the alternator)", "Poor voltage-sensing connection", "Poor battery ground", "Aftermarket electrical accessories or wiring"],
    dontReplace: "The engine computer. The charging system is the usual source.",
    nextSteps: ["Have the charging system tested, including the regulator and sensing circuit."],
    urgency: "limit", urgencyNote: "Overcharging can damage the battery and electronics.",
  },

  // Transmission
  {
    code: "P0700", title: "Transmission Control System Malfunction", system: "Transmission",
    meaning: "The transmission computer found a problem and asked the engine computer to turn on the check-engine light. P0700 itself doesn't say what the problem is. The details are stored in the transmission computer.",
    symptoms: ["Harsh or delayed shifting", "Stuck in one gear (limp mode)", "Sometimes no noticeable change"],
    checkFirst: [tcmCodes, fluidCheck, "Check battery voltage and connections. Low voltage can set transmission codes."],
    causes: ["Depends on the codes stored in the transmission computer"],
    dontReplace: "The transmission or transmission computer. The actual cause is in the transmission computer's own codes.",
    nextSteps: ["Look up the transmission-specific code or codes it reports, and diagnose those."],
    urgency: "limit", urgencyNote: "If the transmission is stuck in one gear or slipping, avoid highway driving until it's checked.",
  },
  sensorCode("P0705", "Transmission Range Sensor Circuit Malfunction (PRNDL Input)", TR, "circuit"),
  sensorCode("P0706", "Transmission Range Sensor Circuit Range/Performance", TR, "range"),
  sensorCode("P0710", "Transmission Fluid Temperature Sensor Circuit Malfunction", TFT, "circuit"),
  sensorCode("P0711", "Transmission Fluid Temperature Sensor Circuit Range/Performance", TFT, "range"),
  sensorCode("P0712", "Transmission Fluid Temperature Sensor Circuit Low Input", TFT, "low"),
  sensorCode("P0713", "Transmission Fluid Temperature Sensor Circuit High Input", TFT, "high"),
  {
    code: "P0715", title: "Input/Turbine Speed Sensor A Circuit", system: "Transmission",
    meaning: "The transmission computer isn't getting a usable signal from the input (turbine) speed sensor, which it uses to control shifting.",
    symptoms: ["Harsh or erratic shifting", "Stuck in one gear (limp mode)", "Speedometer problems on some vehicles"],
    checkFirst: [tcmCodes, fluidCheck, "Inspect the sensor connector and wiring at the transmission for damage, corrosion, or fluid in the connector."],
    causes: ["Failed speed sensor", "Damaged wiring or connector", "Metal debris on the sensor", "Internal transmission problem (less common)"],
    dontReplace: "The transmission or its computer. Check the sensor wiring and signal first.",
    nextSteps: ["Watch input speed in live data on a test drive, and check whether it drops out."],
    urgency: "limit", urgencyNote: "If the transmission is stuck in one gear or shifting unpredictably, avoid highway driving until it's checked.",
  },
  sensorCode("P0716", "Input/Turbine Speed Sensor A Circuit Range/Performance", INPUT_SPEED, "range"),
  sensorCode("P0717", "Input/Turbine Speed Sensor A Circuit No Signal", INPUT_SPEED, "noSignal"),
  sensorCode("P0720", "Output Speed Sensor Circuit Malfunction", OUTPUT_SPEED, "circuit"),
  sensorCode("P0721", "Output Speed Sensor Circuit Range/Performance", OUTPUT_SPEED, "range"),
  sensorCode("P0722", "Output Speed Sensor Circuit No Signal", OUTPUT_SPEED, "noSignal"),
  {
    code: "P0730", title: "Incorrect Gear Ratio", system: "Transmission",
    meaning: "The transmission computer compared input and output speed, and the ratio doesn't match the gear it commanded. That often means slipping.",
    symptoms: ["Slipping or engine revving without matching acceleration", "Harsh or delayed shifts", "Limp mode"],
    checkFirst: [fluidCheck, tcmCodes, "Look for fluid leaks under the vehicle."],
    causes: ["Low or worn-out fluid", "Worn internal clutches", "Shift solenoid or valve body problem", "Speed sensor problem"],
    dontReplace: "The transmission. Low fluid, a sensor, or a solenoid can set this code. Get the fluid and full code list checked first.",
    nextSteps: ["Compare commanded gear with actual ratio in live data to see which gear is slipping."],
    urgency: "limit", urgencyNote: "A slipping transmission can get worse quickly. Avoid heavy driving and towing until it's checked.",
  },
  gearRatio(1), gearRatio(2), gearRatio(3), gearRatio(4), gearRatio(5),
  {
    code: "P0740", title: "Torque Converter Clutch Circuit Malfunction", system: "Transmission",
    meaning: "The torque converter clutch locks the engine to the transmission at cruising speed to save fuel. The transmission computer found a problem in the circuit that controls it.",
    symptoms: ["Higher engine rpm at highway speed", "Lower fuel economy", "Shudder at cruising speed (sometimes)"],
    checkFirst: [fluidCheck, tcmCodes, "Inspect the transmission connector and wiring for damage or fluid in the connector."],
    causes: ["Failed torque converter clutch solenoid", "Damaged wiring or connector", "Brake switch problem (some vehicles use it to release the clutch)", "Transmission computer problem (less common)"],
    dontReplace: "The torque converter. This is a circuit code, so test the solenoid and wiring first.",
    nextSteps: ["Measure the solenoid circuit resistance at the transmission connector and compare it with the specification."],
    urgency: "soon", urgencyNote: "Extra heat is hard on a transmission. Avoid towing until it's checked.",
  },
  {
    code: "P0741", title: "Torque Converter Clutch Circuit Performance or Stuck Off", system: "Transmission",
    meaning: "The torque converter clutch locks the engine to the transmission at cruising speed to save fuel. The computer commanded it on, but it didn't lock up as expected.",
    symptoms: ["Higher engine rpm at highway speed", "Lower fuel economy", "Shudder at cruising speed (sometimes)", "Transmission running hotter"],
    checkFirst: [fluidCheck, tcmCodes, "In live data, compare engine rpm with transmission input speed when the clutch is commanded on. A big difference means it's slipping."],
    causes: ["Low or worn fluid", "Torque converter clutch solenoid problem", "Valve body problem", "Worn torque converter"],
    dontReplace: "The torque converter. Check the fluid and the clutch solenoid circuit first.",
    nextSteps: ["Check the solenoid circuit resistance and wiring at the transmission connector."],
    urgency: "soon", urgencyNote: "Extra heat is hard on a transmission. Avoid towing until it's checked.",
  },
  {
    code: "P0742", title: "Torque Converter Clutch Circuit Stuck On", system: "Transmission",
    meaning: "The torque converter clutch seems to stay locked when the transmission computer commanded it to release. A clutch that won't release acts a bit like a manual transmission with the clutch pedal up.",
    symptoms: ["Engine stalling when coming to a stop", "Shudder or bucking at low speed", "Harsh engagement into gear"],
    checkFirst: [fluidCheck, tcmCodes, "In live data, check whether engine rpm and input speed stay locked together at low speed, when the clutch should be released."],
    causes: ["Sticking torque converter clutch solenoid", "Debris in the valve body", "Low or contaminated fluid", "Internal torque converter problem"],
    dontReplace: "The torque converter. A sticking solenoid or dirty fluid is often the cause.",
    nextSteps: ["Command the clutch off with a scan tool (where supported) and watch whether it releases."],
    urgency: "limit", urgencyNote: "A clutch that stays locked can stall the engine at stops. Take care in traffic until it's checked.",
  },
  {
    code: "P0743", title: "Torque Converter Clutch Circuit Electrical", system: "Transmission",
    meaning: "The transmission computer found an electrical problem (open or short) in the torque converter clutch solenoid circuit.",
    symptoms: ["Higher engine rpm at highway speed", "Lower fuel economy", "Sometimes stalling at stops if it can't release"],
    checkFirst: [fluidCheck, tcmCodes, "Inspect the transmission connector and wiring for damage or fluid wicking into the connector."],
    causes: ["Failed torque converter clutch solenoid", "Damaged wiring or connector", "Brake switch circuit problem (on some vehicles)", "Transmission computer problem (less common)"],
    dontReplace: "The torque converter. This is an electrical code, so test the solenoid circuit first.",
    nextSteps: ["Measure the solenoid's resistance at the transmission connector and compare it with the specification."],
    urgency: "soon", urgencyNote: "Extra heat is hard on a transmission. Avoid towing until it's checked.",
  },
  {
    code: "P0748", title: "Pressure Control Solenoid A Electrical", system: "Transmission",
    meaning: "The transmission computer found an electrical problem with pressure control solenoid A, which sets the hydraulic pressure used for shifting.",
    symptoms: ["Harsh or very soft shifts", "Delayed engagement into gear", "Stuck in one gear (limp mode)"],
    checkFirst: [fluidCheck, tcmCodes, "Inspect the transmission connector and wiring for damage or fluid wicking into the connector."],
    causes: ["Failed pressure control solenoid", "Damaged wiring or connector", "Transmission computer problem (less common)"],
    dontReplace: "The transmission. This is an electrical code, so test the solenoid circuit first.",
    nextSteps: ["Measure the solenoid's resistance at the transmission connector and compare it with the specification."],
    urgency: "limit", urgencyNote: "Harsh or unpredictable shifting can affect control. Avoid highway driving until it's checked.",
  },
  {
    code: "P0750", title: "Shift Solenoid A Malfunction", system: "Transmission",
    meaning: "The transmission computer found an electrical problem with shift solenoid A, one of the valves it uses to change gears.",
    symptoms: ["Harsh or delayed shifts", "Stuck in one gear (limp mode)"],
    checkFirst: [fluidCheck, tcmCodes, "Inspect the transmission connector for damage or fluid wicking into it, and check the wiring."],
    causes: ["Failed shift solenoid", "Damaged wiring or connector", "Transmission computer problem (less common)"],
    dontReplace: "The transmission or valve body. This is an electrical code, so test the solenoid circuit first.",
    nextSteps: ["Measure the solenoid's resistance at the transmission connector and compare it with the specification."],
    urgency: "limit", urgencyNote: "If the transmission is stuck in one gear, avoid highway driving until it's checked.",
  },
  shiftSolenoid("P0751", "A", "stuckOff"), shiftSolenoid("P0752", "A", "stuckOn"), shiftSolenoid("P0753", "A", "electrical"),
  shiftSolenoid("P0755", "B", "malfunction"), shiftSolenoid("P0756", "B", "stuckOff"), shiftSolenoid("P0757", "B", "stuckOn"), shiftSolenoid("P0758", "B", "electrical"),
];
