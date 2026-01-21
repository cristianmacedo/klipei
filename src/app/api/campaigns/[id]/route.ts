import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { db, campaigns, clips, users, transactions } from "@/db";
import { eq, desc, sql } from "drizzle-orm";
import { z } from "zod";
import { nanoid } from "nanoid";

const updateCampaignSchema = z.object({
  title: z.string().min(5).max(100).optional(),
  description: z.string().min(20).max(2000).optional(),
  instructions: z.string().optional(),
  sourceContent: z.string().optional(),
  thumbnailUrl: z.string().url().optional().nullable(),
  status: z.enum(["DRAFT", "ACTIVE", "PAUSED", "COMPLETED"]).optional(),
});

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

    // Check if trying to change locked fields on active campaign
    if (campaign.status === "ACTIVE" || campaign.status === "PAUSED") {
      const allowedFields = [
        "title",
        "description",
        "instructions",
        "sourceContent",
        "status",
      ];
      const providedFields = Object.keys(data);
      const disallowedFields = providedFields.filter(
        (f) => !allowedFields.includes(f)
      );

      if (disallowedFields.length > 0) {
        return NextResponse.json(
          {
            error: `Campos bloqueados após ativação: ${disallowedFields.join(
              ", "
            )}`,
          },
          { status: 400 }
        );
      }
    }

    // Can't change status from COMPLETED
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

    const [updatedCampaign] = await db
      .update(campaigns)
      .set({ ...data, updatedAt: new Date() })
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
