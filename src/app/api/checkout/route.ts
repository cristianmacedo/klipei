import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { db, campaigns, deposits } from "@/db";
import { eq } from "drizzle-orm";
import { getOrCreateStripeCustomer, createCheckoutSession } from "@/lib/stripe";
import { z } from "zod";
import { nanoid } from "nanoid";
import { MINIMUM_BUDGET } from "@/types";

const checkoutSchema = z.object({
  campaignId: z.string(),
  amount: z.number().min(MINIMUM_BUDGET * 100), // in cents
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
    const { campaignId, amount } = checkoutSchema.parse(body);

    // Check if campaign exists and belongs to user
    const campaign = await db.query.campaigns.findFirst({
      where: eq(campaigns.id, campaignId),
    });

    if (!campaign) {
      return NextResponse.json(
        { error: "Campanha não encontrada" },
        { status: 404 }
      );
    }

    if (campaign.creatorId !== user.id) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    // Get or create Stripe customer BEFORE checkout
    const stripeCustomerId = await getOrCreateStripeCustomer(user.id);

    // Create deposit record
    const [deposit] = await db
      .insert(deposits)
      .values({
        id: nanoid(),
        campaignId,
        amount: String(amount / 100), // Convert back to BRL
        status: "PENDING",
      })
      .returning();

    // Create Stripe checkout session with customer
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const session = await createCheckoutSession({
      customerId: stripeCustomerId,
      campaignId,
      amount,
      successUrl: `${appUrl}/dashboard/creator/campaigns/${campaignId}?deposit=success`,
      cancelUrl: `${appUrl}/dashboard/creator/campaigns/${campaignId}?deposit=cancelled`,
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
