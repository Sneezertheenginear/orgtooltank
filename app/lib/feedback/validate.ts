// Server-side validation for feedback. Nothing from the browser is trusted: slugs must be real
// experiments, votes must be one of three words, and comments are cleaned into plain text.
import { experiments } from "../../data/experiments";
import { COMMENT_MAX, COMMENT_MAX_LINKS, NEXT_IDEA_MAX } from "./config";

export type Vote = "like" | "unlike";
export type VoteRequest = Vote | "none";

const slugs = new Set(experiments.map(experiment => experiment.slug));
export const isKnownSlug = (value: unknown): value is string => typeof value === "string" && slugs.has(value);
export const isVoteRequest = (value: unknown): value is VoteRequest => value === "like" || value === "unlike" || value === "none";

/**
 * Plain text only: normalized, control characters removed (line breaks and tabs kept), long runs
 * of blank lines collapsed, and trimmed. Comments are always displayed as text, never as HTML, so
 * markup like <script> is shown literally rather than run.
 */
export function cleanText(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.normalize("NFC").replace(/\r\n?/g, "\n")
    .replace(/[\u0000-\u0008\u000B-\u000C\u000E-\u001F\u007F\u200B-\u200F\u202A-\u202E\u2066-\u2069\uFEFF]/g, "")
    .replace(/\n{3,}/g, "\n\n").trim();
}

const linkCount = (text: string) => (text.match(/https?:\/\/|www\./gi) ?? []).length;

export type CommentInput = { text: string; next: string };
export function validateComment(body: Record<string, unknown>): { ok: true; comment: CommentInput } | { ok: false; error: string } {
  const text = cleanText(body.text), next = cleanText(body.next);
  if (!text && !next) return { ok: false, error: "Write a comment or an idea for what this should do next." };
  if (text.length > COMMENT_MAX) return { ok: false, error: `Comments can be up to ${COMMENT_MAX.toLocaleString("en-US")} characters.` };
  if (next.length > NEXT_IDEA_MAX) return { ok: false, error: `The “what next” idea can be up to ${NEXT_IDEA_MAX.toLocaleString("en-US")} characters.` };
  if (linkCount(text) + linkCount(next) > COMMENT_MAX_LINKS) return { ok: false, error: `Comments can include up to ${COMMENT_MAX_LINKS} links.` };
  return { ok: true, comment: { text, next } };
}
