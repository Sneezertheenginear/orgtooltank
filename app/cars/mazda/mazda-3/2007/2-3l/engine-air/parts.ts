export const ENGINE_AIR_PATH = "/cars/mazda/mazda-3/2007/2-3l/engine-air";

export const engineAirParts = [
  { slug: "pcv-system", title: "PCV System", detail: "Vents crankcase vapors and routes them back into the intake." },
  { slug: "intake-manifold", title: "Intake Manifold", detail: "Delivers air from the throttle body to each cylinder." },
  { slug: "throttle-body", title: "Throttle Body", detail: "Controls how much air the engine is allowed to take in." },
  { slug: "air-intake", title: "Air Intake", detail: "The air filter, housing, and ducting that bring in clean air." },
  { slug: "mass-air-flow-sensor", title: "Mass Air Flow Sensor", detail: "Measures incoming air so the engine computer can match fuel to it." },
  { slug: "vacuum-lines", title: "Vacuum Lines", detail: "Small hoses that carry engine vacuum to the parts that use it." },
  { slug: "engine-mounts", title: "Engine Mounts", detail: "Hold the engine in place and absorb its vibration." },
  { slug: "belts-and-pulleys", title: "Belts & Pulleys", detail: "Drive the accessories that run off the engine." },
  { slug: "spark-plugs", title: "Spark Plugs", detail: "Ignite the air and fuel mixture inside each cylinder." },
  { slug: "ignition-coils", title: "Ignition Coils", detail: "Turn low battery voltage into the high voltage a spark plug needs." },
  { slug: "valve-cover", title: "Valve Cover", detail: "Seals the top of the engine and keeps oil where it belongs." },
  { slug: "oil-and-lubrication", title: "Oil & Lubrication", detail: "The oil, filter, and passages that protect moving parts." },
] as const;

export const VEHICLE_LABEL = "2007 Mazda 3 — 2.3L";

export type EngineAirPart = (typeof engineAirParts)[number];
