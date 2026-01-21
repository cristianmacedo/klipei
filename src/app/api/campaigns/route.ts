import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { db, campaigns, users, transactions } from "@/db";
import { eq, desc, and, sql } from "drizzle-orm";
import { z } from "zod";
import { nanoid } from "nanoid";
import {
  MINIMUM_BUDGET,
  MINIMUM_RATE_PER_MIL,
  MAXIMUM_RATE_PER_MIL,
  type CampaignStatus,
} from "@/types";

// Valid enum values for filtering
const VALID_STATUSES: CampaignStatus[] = ["DRAFT", "ACTIVE", "PAUSED", "COMPLETED"];
const VALID_TYPES = ["CLIPPING", "UGC"] as const;

const createCampaignSchema = z.object({
  title: z.string().min(5).max(100),
  description: z.string().min(20).max(2000),
  type: z.enum(["CLIPPING", "UGC"]),
  platforms: z
    .array(z.enum(["YOUTUBE", "TIKTOK", "INSTAGRAM", "TWITTER"]))
    .min(1),
  budget: z.number().min(MINIMUM_BUDGET),
  ratePerMil: z.number().min(MINIMUM_RATE_PER_MIL).max(MAXIMUM_RATE_PER_MIL),
  maxPayoutPerClip: z.number().min(0).optional(),
  requirements: z.array(z.string()).optional(),
  instructions: z.string().optional(),
  sourceContent: z.string().optional(),
  thumbnailUrl: z.string().url().optional(),
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

    // Ensure user exists in DB (outside transaction for auto-create)
    let dbUser = await db.query.users.findFirst({
      where: eq(users.id, user.id),
    });

    if (!dbUser) {
      const [newUser] = await db
        .insert(users)
        .values({
          id: user.id,
          email: user.email!,
          name: user.user_metadata?.name || user.email?.split("@")[0],
          avatarUrl: user.user_metadata?.avatar_url,
          role: "CREATOR",
        })
        .returning();
      dbUser = newUser;
    }

    const body = await request.json();
    const data = createCampaignSchema.parse(body);

    // Atomic transaction: check balance, debit, create campaign, create transaction record
    const result = await db.transaction(async (tx) => {
      // Re-fetch user inside transaction to get latest balance
      const [currentUser] = await tx
        .select()
        .from(users)
        .where(eq(users.id, user.id));

      const userBalance = Number(currentUser.balance);
      if (userBalance < data.budget) {
        throw new Error(
          JSON.stringify({
            type: "INSUFFICIENT_BALANCE",
            balance: userBalance,
            required: data.budget,
          })
        );
      }

      const newBalance = userBalance - data.budget;
      const campaignId = nanoid();

      // Deduct budget from user's wallet
      await tx
        .update(users)
        .set({
          balance: String(newBalance),
          updatedAt: new Date(),
        })
        .where(eq(users.id, user.id));

      // Create campaign
      const [campaign] = await tx
        .insert(campaigns)
        .values({
          id: campaignId,
          creatorId: user.id,
          title: data.title,
          description: data.description,
          type: data.type,
          platforms: data.platforms,
          budget: String(data.budget),
          ratePerMil: String(data.ratePerMil),
          maxPayoutPerClip: data.maxPayoutPerClip
            ? String(data.maxPayoutPerClip)
            : null,
          requirements: data.requirements || [],
          instructions: data.instructions,
          sourceContent: data.sourceContent,
          thumbnailUrl: data.thumbnailUrl,
          status: "DRAFT",
        })
        .returning();

      // Create transaction record
      await tx.insert(transactions).values({
        id: nanoid(),
        userId: user.id,
        type: "CAMPAIGN_FUND",
        amount: String(-data.budget),
        balanceAfter: String(newBalance),
        campaignId: campaignId,
        description: `Financiamento da campanha: ${data.title}`,
      });

      return campaign;
    });

    return NextResponse.json({ success: true, campaign: result });
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
              error: "Saldo insuficiente",
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

    console.error("Error creating campaign:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const type = searchParams.get("type");

    const conditions = [];
    if (status && VALID_STATUSES.includes(status as CampaignStatus)) {
      conditions.push(eq(campaigns.status, status as CampaignStatus));
    }
    if (type && VALID_TYPES.includes(type as (typeof VALID_TYPES)[number])) {
      conditions.push(eq(campaigns.type, type as (typeof VALID_TYPES)[number]));
    }

    const result = await db
      .select({
        campaign: campaigns,
        creator: {
          id: users.id,
          name: users.name,
          email: users.email,
          avatarUrl: users.avatarUrl,
        },
      })
      .from(campaigns)
      .leftJoin(users, eq(campaigns.creatorId, users.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(campaigns.createdAt));

    const campaignsWithCreator = result.map((r) => ({
      ...r.campaign,
      creator: r.creator,
    }));

    return NextResponse.json({ campaigns: campaignsWithCreator });
  } catch (error) {
    console.error("Error fetching campaigns:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
