import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { stripe } from "@/lib/stripe";
import { db, deposits, campaigns } from "@/db";
import { eq, sql } from "drizzle-orm";
import Stripe from "stripe";

export async function POST(request: Request) {
  const body = await request.text();
  const headersList = await headers();
  const signature = headersList.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "No signature" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  // Handle the event
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      await handleCheckoutCompleted(session);
      break;
    }

    case "checkout.session.expired": {
      const session = event.data.object as Stripe.Checkout.Session;
      await handleCheckoutExpired(session);
      break;
    }

    case "payment_intent.payment_failed": {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      await handlePaymentFailed(paymentIntent);
      break;
    }

    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  return NextResponse.json({ received: true });
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  // Find the deposit by session ID
  const deposit = await db.query.deposits.findFirst({
    where: eq(deposits.stripeSessionId, session.id),
  });

  if (!deposit) {
    console.error(`Deposit not found for session: ${session.id}`);
    return;
  }

  // Update deposit status
  await db
    .update(deposits)
    .set({
      status: "COMPLETED",
      stripePaymentId: session.payment_intent as string,
    })
    .where(eq(deposits.id, deposit.id));

  // Add amount to campaign budget and activate if draft
  const campaign = await db.query.campaigns.findFirst({
    where: eq(campaigns.id, deposit.campaignId),
  });

  if (campaign) {
    await db
      .update(campaigns)
      .set({
        budget: sql`${campaigns.budget} + ${deposit.amount}`,
        status: campaign.status === "DRAFT" ? "ACTIVE" : campaign.status,
        updatedAt: new Date(),
      })
      .where(eq(campaigns.id, deposit.campaignId));
  }

  console.log(`Deposit ${deposit.id} completed for campaign ${deposit.campaignId}`);
}

async function handleCheckoutExpired(session: Stripe.Checkout.Session) {
  // Mark deposit as failed
  const result = await db
    .update(deposits)
    .set({ status: "FAILED" })
    .where(eq(deposits.stripeSessionId, session.id));

  console.log(`Checkout expired for session: ${session.id}`);
}

async function handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
  // Find deposit by payment intent ID (if we have it)
  // This can happen if payment fails after checkout was created
  const deposit = await db.query.deposits.findFirst({
    where: eq(deposits.stripePaymentId, paymentIntent.id),
  });

  if (deposit) {
    await db
      .update(deposits)
      .set({ status: "FAILED" })
      .where(eq(deposits.id, deposit.id));

    console.log(`Payment failed for deposit: ${deposit.id}`);
  } else {
    // Payment intent might not be linked to deposit yet
    // Log for debugging
    console.log(`Payment failed for intent: ${paymentIntent.id} (no deposit found)`);
  }
}
