// app/api/verify-download/route.ts
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get("session_id");

  if (!sessionId) {
    return Response.json(
      { valid: false, message: "Missing payment session." },
      { status: 400 },
    );
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== "paid") {
      return Response.json(
        { valid: false, message: "Payment could not be verified." },
        { status: 403 },
      );
    }

    return Response.json({ valid: true, message: "Payment verified." });
  } catch (error) {
    console.error("STRIPE VERIFY ERROR:", error);
    return Response.json(
      { valid: false, message: "Could not verify payment." },
      { status: 500 },
    );
  }
}
