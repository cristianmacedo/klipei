import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { db, clips, campaigns } from "@/db";
import { eq } from "drizzle-orm";
import { z } from "zod";

const reviewSchema = z.object({
  action: z.enum(["approve", "reject"]),
  reason: z.string().optional(),
});

export async function POST(
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

    const clip = await db.query.clips.findFirst({
      where: eq(clips.id, id),
      with: {
        campaign: true,
      },
    });

    if (!clip) {
      return NextResponse.json(
        { error: "Clip não encontrado" },
        { status: 404 }
      );
    }

    // Check if user is the campaign creator
    if (clip.campaign.creatorId !== user.id) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    // Check if clip is pending
    if (clip.status !== "PENDING") {
      return NextResponse.json(
        { error: "Este clip já foi revisado" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { action, reason } = reviewSchema.parse(body);

    if (action === "reject" && !reason) {
      return NextResponse.json(
        { error: "Motivo da rejeição é obrigatório" },
        { status: 400 }
      );
    }

    if (action === "approve") {
      // Approve the clip
      await db
        .update(clips)
        .set({
          status: "APPROVED",
          reviewedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(clips.id, id));

      return NextResponse.json({ success: true, status: "APPROVED" });
    } else {
      // Reject the clip
      await db
        .update(clips)
        .set({
          status: "REJECTED",
          rejectionReason: reason,
          reviewedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(clips.id, id));

      return NextResponse.json({ success: true, status: "REJECTED" });
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Dados inválidos", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Error reviewing clip:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
