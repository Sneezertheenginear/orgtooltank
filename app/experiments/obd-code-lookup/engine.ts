// Normalizes what the user typed, checks that it looks like an OBD-II code, and finds it in the local
// library. Unknown codes are never guessed at: the result only explains what kind of code it is.
import { codes, type CodeInfo, type Urgency } from "./codes";

export { codes, type CodeInfo, type Urgency };
const byCode = new Map(codes.map(c => [c.code, c]));

/** OBD-II format: a system letter, then a digit 0–3, then three hex characters (P0300, U0100, P2A00). */
export const CODE_PATTERN = /^[PBCU][0-3][0-9A-F]{3}$/;

/**
 * Uppercases, trims, and removes spaces and dashes. A letter O typed in the second position is read as a
 * zero (PO300 → P0300), since OBD-II codes never have a letter there.
 */
export function normalize(input: string): { code: string; fixedLetterO: boolean } {
  const code = input.trim().toUpperCase().replace(/[\s-]+/g, "");
  if (/^[PBCU]O/.test(code) && CODE_PATTERN.test(`${code[0]}0${code.slice(2)}`)) return { code: `${code[0]}0${code.slice(2)}`, fixedLetterO: true };
  return { code, fixedLetterO: false };
}

export const systems: Record<string, string> = { P: "Powertrain (engine and transmission)", B: "Body", C: "Chassis", U: "Network (module communication)" };

/** Whether the code's number range is defined by the SAE standard or by each manufacturer. */
export function codeFamily(code: string): "generic" | "manufacturer" | "either" {
  const digit = code[1];
  if (code[0] === "P") return digit === "0" || digit === "2" ? "generic" : digit === "1" ? "manufacturer" : "either";
  return digit === "0" ? "generic" : "manufacturer";
}

export type Lookup =
  | { kind: "invalid"; input: string }
  | { kind: "found"; code: string; info: CodeInfo; fixedLetterO: boolean }
  | { kind: "unknown"; code: string; family: ReturnType<typeof codeFamily>; system: string; fixedLetterO: boolean };

export function lookup(input: string): Lookup {
  const { code, fixedLetterO } = normalize(input);
  if (!CODE_PATTERN.test(code)) return { kind: "invalid", input: input.trim() };
  const info = byCode.get(code);
  if (info) return { kind: "found", code, info, fixedLetterO };
  return { kind: "unknown", code, family: codeFamily(code), system: systems[code[0]], fixedLetterO };
}

export const urgencyText: Record<Urgency, string> = {
  low: "Usually low urgency if the vehicle runs normally.",
  soon: "Diagnose soon.",
  limit: "Avoid heavy driving until checked.",
};
export const STOP_DRIVING = "Stop driving if you also notice severe symptoms, such as overheating, a flashing check-engine light, loss of oil pressure, a major misfire, or unsafe throttle behavior.";
export const CODE_NOTE = "A trouble code tells you what the computer detected. It does not automatically prove which part failed.";
export const EXAMPLES = ["P0300", "P0420", "P0171", "P0123"];
