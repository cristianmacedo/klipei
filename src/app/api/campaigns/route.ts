import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { db, campaigns, users } from "@/db";
import { eq, desc, and, sql } from "drizzle-orm";
import { z } from "zod";
import { nanoid } from "nanoid";
import {
  MINIMUM_BUDGET,
  MINIMUM_RATE_PER_MIL,
  MAXIMUM_RATE_PER_MIL,
} from "@/types";

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

    // Ensure user exists in DB
    let dbUser = await db.query.users.findFirst({
      where: eq(users.id, user.id),
    });

    if (!dbUser) {
      // Auto-create user if doesn't exist
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

    // Check if user has enough balance
    const userBalance = Number(dbUser.balance);
    if (userBalance < data.budget) {
      return NextResponse.json(
        {
          error: "Saldo insuficiente",
          balance: userBalance,
          required: data.budget,
        },
        { status: 400 }
      );
    }

    // Deduct budget from user's wallet
    await db
      .update(users)
      .set({
        balance: sql`${users.balance} - ${data.budget}`,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id));

    // Create campaign with the allocated budget
    const [campaign] = await db
      .insert(campaigns)
      .values({
        id: nanoid(),
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

    return NextResponse.json({ success: true, campaign });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Dados inválidos", details: error.issues },
        { status: 400 }
      );
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
    if (status) {
      conditions.push(eq(campaigns.status, status as any));
    }
    if (type) {
      conditions.push(eq(campaigns.type, type as any));
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
