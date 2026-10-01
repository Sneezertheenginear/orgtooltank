import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import { test } from "node:test";

// The engine imports sibling files without extensions (bundler style); resolve them to .ts here.
registerHooks({ resolve: (specifier, context, next) => { try { return next(specifier, context); } catch (error) { if (specifier.startsWith(".")) return next(`${specifier}.ts`, context); throw error; } } });
const E = await import("./engine.ts");

const requested = ["P0300", "P0301", "P0302", "P0303", "P0304", "P0171", "P0172", "P0420", "P0430", "P0121", "P0122", "P0123", "P0101", "P0102", "P0103", "P0117", "P0118", "P0130", "P0131", "P0132", "P0133", "P0134", "P0135", "P0440", "P0441", "P0442", "P0455", "P0456", "P0500", "P0700"];

test("every requested starter code is in the library, and so are the examples", () => {
  for (const code of [...requested, ...E.EXAMPLES]) assert.equal(E.lookup(code).kind, "found", code);
});

test("every entry is complete, unique, and well formed", () => {
  const seen = new Set();
  for (const c of E.codes) {
    assert.match(c.code, E.CODE_PATTERN, c.code);
    assert.ok(!seen.has(c.code), `duplicate ${c.code}`); seen.add(c.code);
    for (const key of ["title", "meaning", "dontReplace"]) assert.ok(c[key].trim().length > 10, `${c.code} ${key}`);
    assert.ok(c.system.trim().length > 3, `${c.code} system`);
    for (const key of ["symptoms", "checkFirst", "causes", "nextSteps"]) assert.ok(c[key].length >= 1 && c[key].every(s => s.trim()), `${c.code} ${key}`);
    assert.ok(c.causes.length >= (c.code === "P0700" ? 1 : 3), `${c.code} needs several causes`);
    assert.ok(["low", "soon", "limit"].includes(c.urgency), c.code);
  }
  assert.ok(E.codes.length >= 100, `only ${E.codes.length} codes`);
});

test("the library is generic P0xxx codes only, covering every priority area", () => {
  for (const c of E.codes) assert.match(c.code, /^P0[0-9A-F]{3}$/, `${c.code} isn't a generic P0 code`);
  const systems = new Set(E.codes.map(c => c.system));
  for (const area of ["Ignition and misfire", "Fuel and air mixture", "Oxygen sensors", "Catalytic converter", "Evaporative emissions (EVAP)", "Throttle control", "Air intake", "Engine cooling", "Engine timing", "Variable valve timing", "Exhaust gas recirculation (EGR)", "Idle control", "Vehicle speed", "Transmission"]) assert.ok(systems.has(area), `missing area: ${area}`);
  for (const code of ["P0105", "P0106", "P0107", "P0108", "P0110", "P0112", "P0113", "P0336", "P0341", "P0401", "P0402", "P0505", "P0506", "P0507", "P0705", "P0717", "P0720", "P0731"]) assert.equal(E.lookup(code).kind, "found", code);
});

test("family templates produce code-specific text", () => {
  const info = code => E.lookup(code).info;
  assert.match(info("P0206").title, /Cylinder 6/); assert.match(info("P0206").checkFirst.join(" "), /cylinder 6/);
  assert.match(info("P0353").title, /Coil C/); assert.match(info("P0353").meaning, /cylinder 3/);
  assert.match(info("P0733").meaning, /third gear/);
  assert.match(info("P0155").title, /Heater.*Bank 2, Sensor 1/); assert.match(info("P0155").meaning, /upstream/);
  assert.match(info("P0157").meaning, /downstream/); assert.equal(info("P0157").urgency, "low"); assert.equal(info("P0131").urgency, "soon");
  assert.match(info("P0021").title, /"A".*Over-Advanced.*Bank 2/); assert.match(info("P0012").meaning, /retarded/);
  assert.match(info("P0112").meaning, /extremely hot/); assert.match(info("P0113").meaning, /extremely cold/);
  assert.match(info("P0112").checkFirst.join(" "), /Unplug the sensor/); assert.match(info("P0113").checkFirst.join(" "), /jumper/);
  assert.match(info("P0106").dontReplace, /vacuum hose/);
  assert.match(info("P0752").meaning, /commanded shift solenoid A off/);
  for (const c of E.codes) assert.doesNotMatch(c.meaning, /undefined|\$\{|  /, `${c.code} meaning has a template glitch`);
});

test("wording stays restrained: no guarantees, prices, or safety verdicts", () => {
  const all = JSON.stringify(E.codes);
  assert.doesNotMatch(all, /\$\d|guarantee|definitely|always the|safe to drive|100%/i);
});

test("input is normalized: case, spaces, dashes, and a letter O for zero", () => {
  for (const input of ["p0123", " P0123 ", "p 0123", "P-0123", "\tp0123\n"]) {
    const r = E.lookup(input); assert.equal(r.kind, "found", input); assert.equal(r.code, "P0123");
  }
  const o = E.lookup("po300");
  assert.equal(o.kind, "found"); assert.equal(o.code, "P0300"); assert.equal(o.fixedLetterO, true);
  assert.equal(E.lookup("P0300").fixedLetterO, false);
});

test("things that aren't codes are invalid", () => {
  for (const input of ["", "   ", "300", "P03", "P03000", "X0300", "P4300", "P0G00", "check engine"]) assert.equal(E.lookup(input).kind, "invalid", JSON.stringify(input));
});

test("unknown but valid codes are reported honestly, with what kind of code they are", () => {
  const generic = E.lookup("P0999");
  assert.equal(generic.kind, "unknown"); assert.equal(generic.family, "generic");
  assert.equal(E.lookup("p1345").family, "manufacturer");
  assert.equal(E.lookup("P3400").family, "either");
  assert.equal(E.lookup("P2A00").family, "generic");
  const network = E.lookup("u0100");
  assert.equal(network.kind, "unknown"); assert.equal(network.system, "Network (module communication)"); assert.equal(network.family, "generic");
  assert.equal(E.lookup("B1234").family, "manufacturer");
});

test("misfire and paired-bank entries are specific to their cylinder or bank", () => {
  assert.match(E.lookup("P0303").info.meaning, /cylinder 3/);
  assert.match(E.lookup("P0303").info.checkFirst.join(" "), /cylinder 3/);
  assert.match(E.lookup("P0430").info.title, /Bank 2/);
  assert.match(E.lookup("P0174").info.nextSteps.join(" "), /P0171/);
});
