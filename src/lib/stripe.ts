import Stripe from "stripe";
import { db, users } from "@/db";
import { eq } from "drizzle-orm";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-12-15.clover",
  typescript: true,
});

/**
 * Get or create a Stripe customer for a user.
 * Always creates customer BEFORE checkout (best practice from Stripe docs).
 */
export async function getOrCreateStripeCustomer(userId: string) {
  // Get user from DB
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });

  if (!user) {
    throw new Error("User not found");
  }

  // If user already has a Stripe customer ID, return it
  if (user.stripeCustomerId) {
    return user.stripeCustomerId;
  }

  // Create new Stripe customer
  const customer = await stripe.customers.create({
    email: user.email,
    name: user.name || undefined,
    metadata: {
      userId: user.id, // Important: link back to our user
    },
  });

  // Save customer ID to user
  await db
    .update(users)
    .set({
      stripeCustomerId: customer.id,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId));

  return customer.id;
}

export async function createCheckoutSession({
  customerId,
  depositId,
  amount,
  successUrl,
  cancelUrl,
}: {
  customerId: string;
  depositId: string;
  amount: number; // in cents (BRL)
  successUrl: string;
  cancelUrl: string;
}) {
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "brl",
          unit_amount: amount,
          product_data: {
            name: "Depósito na Carteira",
            description: `Adicionar R$${(amount / 100).toFixed(
              2
            )} à sua carteira`,
          },
        },
        quantity: 1,
      },
    ],
    mode: "payment",
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      depositId,
    },
  });

  return session;
}
