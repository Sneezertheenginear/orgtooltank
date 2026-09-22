import type { EngineAirPart } from "../parts";
import { pcvSystemGuide } from "./pcv-system";
import type { PartGuide } from "./types";

/** Parts with a full guide page. Parts not listed here fall back to the "Guide being built" stub. */
export const partGuides: Partial<Record<EngineAirPart["slug"], PartGuide>> = {
  "pcv-system": pcvSystemGuide,
};
