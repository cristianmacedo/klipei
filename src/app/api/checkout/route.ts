import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { db, deposits } from "@/db";
import { eq } from "drizzle-orm";
import { getOrCreateStripeCustomer, createCheckoutSession } from "@/lib/stripe";
import { z } from "zod";
import { nanoid } from "nanoid";

const checkoutSchema = z.object({
  amount: z.number().min(1000), // Minimum R$10 in cents
});

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { amount } = checkoutSchema.parse(body);

    // Get or create Stripe customer
    const stripeCustomerId = await getOrCreateStripeCustomer(user.id);

    // Create deposit record (now linked to user, not campaign)
    const [deposit] = await db
      .insert(deposits)
      .values({
        id: nanoid(),
        userId: user.id,
        amount: String(amount / 100), // Convert cents to BRL
        status: "PENDING",
      })
      .returning();

    // Create Stripe checkout session
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const session = await createCheckoutSession({
      customerId: stripeCustomerId,
      depositId: deposit.id,
      amount,
      successUrl: `${appUrl}/dashboard/settings?deposit=success`,
      cancelUrl: `${appUrl}/dashboard/settings?deposit=cancelled`,
    });

    // Update deposit with session ID
    await db
      .update(deposits)
      .set({ stripeSessionId: session.id })
      .where(eq(deposits.id, deposit.id));

    return NextResponse.json({ url: session.url });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Dados inválidos", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Error creating checkout:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
