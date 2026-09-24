// Cloudflare Turnstile check for comment submissions. The secret key is read on the server only.

export type TurnstileResult = "passed" | "failed" | "not_configured";

/**
 * Asks Cloudflare whether the browser's Turnstile token is valid. In production, comments are
 * refused when TURNSTILE_SECRET_KEY is missing. In local development the check is skipped.
 */
export async function verifyTurnstile(token: unknown): Promise<TurnstileResult> {
  const secretKey = process.env.TURNSTILE_SECRET_KEY;
  if (!secretKey) {
    if (process.env.NODE_ENV === "production") return "not_configured";
    console.warn(JSON.stringify({ event: "feedback_turnstile_skipped", reason: "TURNSTILE_SECRET_KEY is not set (development only)" }));
    return "passed";
  }
  if (typeof token !== "string" || !token || token.length > 2048) return "failed";
  try {
    const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body: new URLSearchParams({ secret: secretKey, response: token }),
      signal: AbortSignal.timeout(5000),
    });
    const result = await response.json() as { success?: boolean };
    return result.success === true ? "passed" : "failed";
  } catch {
    return "failed";
  }
}
