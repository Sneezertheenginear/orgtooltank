import Stripe from "stripe";
import { get } from "@vercel/blob";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const DOWNLOAD_WINDOW_MINUTES = 30;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get("session_id");

  if (!sessionId) {
    return new Response("Missing payment session.", {
      status: 400,
    });
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["payment_intent"],
    });

    if (session.payment_status !== "paid") {
      return new Response("Payment could not be verified.", {
        status: 403,
      });
    }

    // Block reuse after one successful download.
    if (session.metadata?.download_used === "true") {
      return new Response("This download has already been used.", {
        status: 403,
      });
    }

    // Give the customer 30 minutes from the payment time.
    const paymentIntent =
      typeof session.payment_intent === "string"
        ? null
        : session.payment_intent;

    const paymentTime = paymentIntent?.created ?? session.created;
    const expiresAt = paymentTime + DOWNLOAD_WINDOW_MINUTES * 60;

    const now = Math.floor(Date.now() / 1000);

    if (now > expiresAt) {
      return new Response("This download link has expired.", {
        status: 403,
      });
    }

    const file = await get("Duplicate Finder_0.1.0_x64.dmg", {
      access: "private",
    });

    if (!file || file.statusCode !== 200 || !file.stream) {
      return new Response("Download file not found.", {
        status: 404,
      });
    }

    // Mark this Stripe purchase as used before sending the file.
    await stripe.checkout.sessions.update(sessionId, {
      metadata: {
        ...session.metadata,
        download_used: "true",
        download_used_at: new Date().toISOString(),
      },
    });

    return new Response(file.stream, {
      status: 200,
      headers: {
        "Content-Type": file.blob.contentType || "application/octet-stream",
        "Content-Disposition":
          'attachment; filename="Duplicate Finder_0.1.0_x64.dmg"',
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    console.error("DOWNLOAD ERROR:", error);

    return new Response("Could not process download.", {
      status: 500,
    });
  }
}
