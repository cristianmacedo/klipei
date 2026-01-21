import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { stripe } from "@/lib/stripe";
import { db, deposits, users, transactions } from "@/db";
import { eq } from "drizzle-orm";
import Stripe from "stripe";
import { nanoid } from "nanoid";

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

  // Atomic transaction: update deposit, update balance, create transaction record
  await db.transaction(async (tx) => {
    // Update deposit status
    await tx
      .update(deposits)
      .set({
        status: "COMPLETED",
        stripePaymentId: session.payment_intent as string,
      })
      .where(eq(deposits.id, deposit.id));

    // Get current user balance
    const [currentUser] = await tx
      .select()
      .from(users)
      .where(eq(users.id, deposit.userId));

    const depositAmount = Number(deposit.amount);
    const newBalance = Number(currentUser.balance) + depositAmount;

    // Add amount to user's wallet balance
    await tx
      .update(users)
      .set({
        balance: String(newBalance),
        updatedAt: new Date(),
      })
      .where(eq(users.id, deposit.userId));

    // Create deposit transaction record
    await tx.insert(transactions).values({
      id: nanoid(),
      userId: deposit.userId,
      type: "DEPOSIT",
      amount: String(depositAmount),
      balanceAfter: String(newBalance),
      depositId: deposit.id,
      description: `Depósito via Stripe`,
    });
  });

  console.log(
    `Deposit ${deposit.id} completed. Added R$${deposit.amount} to user ${deposit.userId}'s balance.`
  );
}

async function handleCheckoutExpired(session: Stripe.Checkout.Session) {
  // Mark deposit as failed
  await db
    .update(deposits)
    .set({ status: "FAILED" })
    .where(eq(deposits.stripeSessionId, session.id));

  console.log(`Checkout expired for session: ${session.id}`);
}

async function handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
  // Find deposit by payment intent ID
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
    console.log(
      `Payment failed for intent: ${paymentIntent.id} (no deposit found)`
    );
  }
}
