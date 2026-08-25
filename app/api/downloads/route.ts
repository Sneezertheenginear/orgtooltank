import Stripe from "stripe";
import { get } from "@vercel/blob";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get("session_id");

  if (!sessionId) {
    return new Response("Missing payment session.", {
      status: 400,
    });
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== "paid") {
      return new Response("Payment could not be verified.", {
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
    console.error("STRIPE ERROR:", error);

    return new Response("Could not verify payment.", {
      status: 500,
    });
  }
}
