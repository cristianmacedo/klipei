import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { db, clips, campaigns, users } from "@/db";
import { eq, and } from "drizzle-orm";
import {
  detectPlatform,
  extractYouTubeVideoId,
  extractTikTokVideoId,
  getYouTubeVideoStats,
  verifyOwnershipCode,
} from "@/lib/youtube";
import { z } from "zod";
import { nanoid } from "nanoid";

const createClipSchema = z.object({
  campaignId: z.string(),
  videoUrl: z.string().url(),
  verificationCode: z.string(),
  comment: z.string().optional(),
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
          role: "CLIPPER", // Default to clipper when submitting clip
        })
        .returning();
      dbUser = newUser;
    }

    const body = await request.json();
    const { campaignId, videoUrl, verificationCode } =
      createClipSchema.parse(body);

    // Check if campaign exists and is active
    const campaign = await db.query.campaigns.findFirst({
      where: eq(campaigns.id, campaignId),
    });

    if (!campaign) {
      return NextResponse.json(
        { error: "Campanha não encontrada" },
        { status: 404 }
      );
    }

    if (campaign.status !== "ACTIVE") {
      return NextResponse.json(
        { error: "Esta campanha não está aceitando submissões" },
        { status: 400 }
      );
    }

    // Detect platform and extract video ID
    const platform = detectPlatform(videoUrl);
    if (!platform) {
      return NextResponse.json(
        { error: "Plataforma não suportada" },
        { status: 400 }
      );
    }

    // Check if platform is accepted by campaign
    if (!campaign.platforms.includes(platform)) {
      return NextResponse.json(
        { error: `Esta campanha não aceita vídeos do ${platform}` },
        { status: 400 }
      );
    }

    let videoId: string | null = null;
    if (platform === "YOUTUBE") {
      videoId = extractYouTubeVideoId(videoUrl);
    } else if (platform === "TIKTOK") {
      videoId = extractTikTokVideoId(videoUrl);
    }

    if (!videoId) {
      return NextResponse.json(
        { error: "Não foi possível extrair o ID do vídeo" },
        { status: 400 }
      );
    }

    // Check if clip already submitted
    const existingClip = await db.query.clips.findFirst({
      where: and(
        eq(clips.campaignId, campaignId),
        eq(clips.videoUrl, videoUrl)
      ),
    });

    if (existingClip) {
      return NextResponse.json(
        { error: "Este vídeo já foi submetido para esta campanha" },
        { status: 400 }
      );
    }

    // Verify ownership (only for YouTube for now)
    let isVerified = false;
    let viewsAtSubmission = 0;

    if (platform === "YOUTUBE") {
      isVerified = await verifyOwnershipCode(videoId, verificationCode);

      if (!isVerified) {
        return NextResponse.json(
          {
            error: "Código de verificação não encontrado na descrição do vídeo",
          },
          { status: 400 }
        );
      }

      const stats = await getYouTubeVideoStats(videoId);
      if (stats) {
        viewsAtSubmission = stats.views;
      }
    } else {
      // For TikTok, we trust the user for now (can't verify description)
      isVerified = true;
    }

    // Create clip
    const [clip] = await db
      .insert(clips)
      .values({
        id: nanoid(),
        campaignId,
        clipperId: user.id,
        platform,
        videoUrl,
        videoId,
        verificationCode,
        isVerified,
        viewsAtSubmission,
        currentViews: viewsAtSubmission,
      })
      .returning();

    return NextResponse.json({ success: true, clip });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Dados inválidos", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Error creating clip:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
