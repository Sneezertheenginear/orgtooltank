// Every feedback limit lives here. Change a number and redeploy; nothing else needs editing.
// Windows are in seconds. Each rule counts requests in a fixed window and answers HTTP 429 when
// the count goes over `max`.

export const LIMITS = {
  /** Reading counts and approved comments, per network address. */
  read: { perIp: { max: 120, window: 60 } },
  /** Likes, unlikes, and removing a vote. */
  vote: { perSession: { max: 12, window: 60 }, perIp: { max: 40, window: 60 } },
  /**
   * Comments. `perIp` counts every attempt. `perSession` and `cooldown` (the minimum gap between two
   * comments from one browser) count only submissions that pass validation and Turnstile, so a
   * person fixing a mistake isn't locked out.
   */
  comment: { perSession: { max: 3, window: 600 }, perIp: { max: 20, window: 3600 }, cooldown: 30 },
  /** New anonymous browser IDs handed out to one network address (stops clearing cookies to vote again). */
  newSession: { perIp: { max: 20, window: 3600 } },
  /** Wrong moderator passwords, per network address. */
  adminFailures: { perIp: { max: 5, window: 900 } },
} as const;

export const COMMENT_MAX = 2000;
export const NEXT_IDEA_MAX = 1000;
export const COMMENT_MAX_LINKS = 3;
export const MAX_BODY_BYTES = 8 * 1024;
export const APPROVED_SHOWN = 50;

export const SESSION_COOKIE = "ott_sid";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 365;

export const RATE_LIMITED_MESSAGE = "Too many requests. Try again in a moment.";
export const ALREADY_VOTED_MESSAGE = "You already voted on this.";
