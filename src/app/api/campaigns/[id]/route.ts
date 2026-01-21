import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { db, campaigns, clips, users, transactions } from "@/db";
import { eq, desc } from "drizzle-orm";
import { z } from "zod";
import { nanoid } from "nanoid";
import {
  MINIMUM_BUDGET,
  MINIMUM_RATE_PER_MIL,
  MAXIMUM_RATE_PER_MIL,
} from "@/types";

const updateCampaignSchema = z.object({
  // Always editable
  title: z.string().min(5).max(100).optional(),
  description: z.string().min(20).max(2000).optional(),
  instructions: z.string().optional().nullable(),
  sourceContent: z.string().optional().nullable(),
  thumbnailUrl: z.string().url().optional().nullable(),
  requirements: z.array(z.string()).optional(),
  // Can only increase after leaving DRAFT
  budget: z.number().min(MINIMUM_BUDGET).optional(),
  maxPayoutPerClip: z.number().min(1).optional(),
  // Locked after leaving DRAFT
  ratePerMil: z.number().min(MINIMUM_RATE_PER_MIL).max(MAXIMUM_RATE_PER_MIL).optional(),
  type: z.enum(["CLIPPING", "UGC"]).optional(),
  platforms: z.array(z.enum(["YOUTUBE", "TIKTOK", "INSTAGRAM", "TWITTER"])).min(1).optional(),
  // Status
  status: z.enum(["DRAFT", "ACTIVE", "PAUSED", "COMPLETED"]).optional(),
});

// Fields locked after leaving DRAFT (cannot be changed at all)
const LOCKED_AFTER_DRAFT = ["ratePerMil", "type", "platforms"];

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const campaign = await db.query.campaigns.findFirst({
      where: eq(campaigns.id, id),
      with: {
        creator: true,
        clips: {
          with: {
            clipper: true,
          },
          orderBy: [desc(clips.submittedAt)],
        },
      },
    });

    if (!campaign) {
      return NextResponse.json(
        { error: "Campanha não encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json({ campaign });
  } catch (error) {
    console.error("Error fetching campaign:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const campaign = await db.query.campaigns.findFirst({
      where: eq(campaigns.id, id),
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

    const body = await request.json();
    const data = updateCampaignSchema.parse(body);

    // Never allow going back to DRAFT
    if (data.status === "DRAFT" && campaign.status !== "DRAFT") {
      return NextResponse.json(
        { error: "Campanha não pode voltar para rascunho" },
        { status: 400 }
      );
    }

    // Can't change status from COMPLETED (except to COMPLETED itself)
    if (
      campaign.status === "COMPLETED" &&
      data.status &&
      data.status !== "COMPLETED"
    ) {
      return NextResponse.json(
        { error: "Campanha finalizada não pode ser reativada" },
        { status: 400 }
      );
    }

    // COMPLETED campaigns can only edit cosmetic fields
    if (campaign.status === "COMPLETED") {
      const allowedForCompleted = ["title", "description"];
      const providedFields = Object.keys(data).filter(
        (f) => data[f as keyof typeof data] !== undefined
      );
      const disallowedFields = providedFields.filter(
        (f) => !allowedForCompleted.includes(f)
      );

      if (disallowedFields.length > 0) {
        return NextResponse.json(
          {
            error: `Campanhas finalizadas só permitem editar título e descrição`,
          },
          { status: 400 }
        );
      }
    }

    // If campaign has left DRAFT, apply restrictions
    if (campaign.status !== "DRAFT") {
      // Check for locked fields
      for (const field of LOCKED_AFTER_DRAFT) {
        if (data[field as keyof typeof data] !== undefined) {
          return NextResponse.json(
            {
              error: `Campo "${field}" não pode ser alterado após a campanha ser ativada`,
            },
            { status: 400 }
          );
        }
      }

      // Check fields that can only increase
      if (data.budget !== undefined) {
        const currentBudget = Number(campaign.budget);
        if (data.budget < currentBudget) {
          return NextResponse.json(
            {
              error: `Orçamento não pode ser reduzido. Valor atual: R$ ${currentBudget.toFixed(2)}`,
            },
            { status: 400 }
          );
        }
      }

      if (data.maxPayoutPerClip !== undefined && data.maxPayoutPerClip !== null) {
        const currentMaxPayout = campaign.maxPayoutPerClip
          ? Number(campaign.maxPayoutPerClip)
          : 0;
        if (data.maxPayoutPerClip < currentMaxPayout) {
          return NextResponse.json(
            {
              error: `Payout máximo não pode ser reduzido. Valor atual: R$ ${currentMaxPayout.toFixed(2)}`,
            },
            { status: 400 }
          );
        }
      }
    }

    // Prepare update data (convert numbers to strings for decimal fields)
    const updateData: Record<string, unknown> = {
      ...data,
      updatedAt: new Date(),
    };

    if (data.budget !== undefined) {
      updateData.budget = String(data.budget);
    }
    if (data.maxPayoutPerClip !== undefined) {
      updateData.maxPayoutPerClip =
        data.maxPayoutPerClip !== null ? String(data.maxPayoutPerClip) : null;
    }
    if (data.ratePerMil !== undefined) {
      updateData.ratePerMil = String(data.ratePerMil);
    }

    // Check if budget is increasing - requires charging the difference
    const currentBudget = Number(campaign.budget);
    const newBudget = data.budget !== undefined ? data.budget : currentBudget;
    const budgetDifference = newBudget - currentBudget;

    if (budgetDifference > 0) {
      // Budget is increasing - need to charge the user atomically
      const result = await db.transaction(async (tx) => {
        // Re-fetch user balance inside transaction to avoid race conditions
        const [currentUser] = await tx
          .select()
          .from(users)
          .where(eq(users.id, user.id));

        const userBalance = Number(currentUser.balance);

        if (userBalance < budgetDifference) {
          throw new Error(
            JSON.stringify({
              type: "INSUFFICIENT_BALANCE",
              balance: userBalance,
              required: budgetDifference,
            })
          );
        }

        const newBalance = userBalance - budgetDifference;

        // Deduct the difference from user's wallet
        await tx
          .update(users)
          .set({
            balance: String(newBalance),
            updatedAt: new Date(),
          })
          .where(eq(users.id, user.id));

        // Update campaign
        const [updatedCampaign] = await tx
          .update(campaigns)
          .set(updateData)
          .where(eq(campaigns.id, id))
          .returning();

        // Create transaction record
        await tx.insert(transactions).values({
          id: nanoid(),
          userId: user.id,
          type: "CAMPAIGN_FUND",
          amount: String(-budgetDifference),
          balanceAfter: String(newBalance),
          campaignId: id,
          description: `Aumento de orçamento da campanha: ${campaign.title}`,
        });

        return { campaign: updatedCampaign, charged: budgetDifference, newBalance };
      });

      return NextResponse.json({
        success: true,
        campaign: result.campaign,
        budgetChange: {
          previousBudget: currentBudget,
          newBudget: newBudget,
          amountCharged: result.charged,
          newBalance: result.newBalance,
        },
      });
    }

    // No budget increase - just update normally
    const [updatedCampaign] = await db
      .update(campaigns)
      .set(updateData)
      .where(eq(campaigns.id, id))
      .returning();

    return NextResponse.json({ success: true, campaign: updatedCampaign });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Dados inválidos", details: error.issues },
        { status: 400 }
      );
    }

    // Handle insufficient balance error from transaction
    if (error instanceof Error && error.message.startsWith("{")) {
      try {
        const parsed = JSON.parse(error.message);
        if (parsed.type === "INSUFFICIENT_BALANCE") {
          return NextResponse.json(
            {
              error: "Saldo insuficiente para aumentar o orçamento",
              balance: parsed.balance,
              required: parsed.required,
            },
            { status: 400 }
          );
        }
      } catch {
        // Not a JSON error, fall through
      }
    }

    console.error("Error updating campaign:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const campaign = await db.query.campaigns.findFirst({
      where: eq(campaigns.id, id),
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

    // Calculate refund: budget - spent
    const budget = Number(campaign.budget);
    const spent = Number(campaign.spent);
    const refund = budget - spent;

    // Only DRAFT campaigns can be deleted (refund full budget)
    // ACTIVE/PAUSED campaigns can be cancelled (refund remaining budget)
    if (campaign.status === "DRAFT") {
      // Refund and delete atomically
      await db.transaction(async (tx) => {
        if (budget > 0) {
          // Get current balance for transaction record
          const [currentUser] = await tx
            .select()
            .from(users)
            .where(eq(users.id, user.id));
          const newBalance = Number(currentUser.balance) + budget;

          // Refund the full budget back to user's wallet
          await tx
            .update(users)
            .set({
              balance: String(newBalance),
              updatedAt: new Date(),
            })
            .where(eq(users.id, user.id));

          // Create refund transaction record
          await tx.insert(transactions).values({
            id: nanoid(),
            userId: user.id,
            type: "CAMPAIGN_REFUND",
            amount: String(budget),
            balanceAfter: String(newBalance),
            campaignId: id,
            description: `Reembolso da campanha excluída: ${campaign.title}`,
          });
        }

        // Delete the draft campaign
        await tx.delete(campaigns).where(eq(campaigns.id, id));
      });

      return NextResponse.json({
        success: true,
        action: "deleted",
        refunded: budget,
      });
    }

    // For ACTIVE/PAUSED campaigns, cancel and refund remaining
    if (campaign.status === "ACTIVE" || campaign.status === "PAUSED") {
      // Refund and update status atomically
      await db.transaction(async (tx) => {
        if (refund > 0) {
          // Get current balance for transaction record
          const [currentUser] = await tx
            .select()
            .from(users)
            .where(eq(users.id, user.id));
          const newBalance = Number(currentUser.balance) + refund;

          // Refund remaining budget (budget - spent)
          await tx
            .update(users)
            .set({
              balance: String(newBalance),
              updatedAt: new Date(),
            })
            .where(eq(users.id, user.id));

          // Create refund transaction record
          await tx.insert(transactions).values({
            id: nanoid(),
            userId: user.id,
            type: "CAMPAIGN_REFUND",
            amount: String(refund),
            balanceAfter: String(newBalance),
            campaignId: id,
            description: `Reembolso da campanha cancelada: ${campaign.title}`,
          });
        }

        // Mark campaign as completed (cancelled)
        await tx
          .update(campaigns)
          .set({
            status: "COMPLETED",
            updatedAt: new Date(),
          })
          .where(eq(campaigns.id, id));
      });

      return NextResponse.json({
        success: true,
        action: "cancelled",
        refunded: refund,
      });
    }

    // COMPLETED campaigns can't be deleted/cancelled
    return NextResponse.json(
      { error: "Campanhas finalizadas não podem ser excluídas" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error deleting campaign:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
