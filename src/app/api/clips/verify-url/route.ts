import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  detectPlatform,
  extractYouTubeVideoId,
  extractTikTokVideoId,
  generateVerificationCode,
} from "@/lib/youtube";
import { z } from "zod";

const schema = z.object({
  videoUrl: z.string().url(),
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
    const { videoUrl } = schema.parse(body);

    // Detect platform
    const platform = detectPlatform(videoUrl);
    if (!platform) {
      return NextResponse.json(
        { error: "Plataforma não suportada. Use YouTube ou TikTok." },
        { status: 400 }
      );
    }

    // Extract video ID
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

    // Generate verification code
    const verificationCode = generateVerificationCode();

    return NextResponse.json({
      success: true,
      platform,
      videoId,
      verificationCode,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "URL inválida" }, { status: 400 });
    }

    console.error("Error verifying URL:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
