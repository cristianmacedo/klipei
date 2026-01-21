import { NextResponse } from "next/server";
import { db, clips, campaigns, users } from "@/db";
import { eq, sql } from "drizzle-orm";
import { getYouTubeVideosStatsBatch } from "@/lib/youtube";

// This endpoint can be called by a cron job to update views
export async function POST(request: Request) {
  try {
    // Verify cron secret (optional but recommended)
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all approved clips that need view updates
    const approvedClips = await db.query.clips.findMany({
      where: eq(clips.status, "APPROVED"),
      with: {
        campaign: true,
      },
    });

    // Filter YouTube clips
    const youtubeClips = approvedClips.filter((c) => c.platform === "YOUTUBE");

    // Batch fetch all video stats at once (much faster than individual requests)
    const videoIds = youtubeClips.map((c) => c.videoId);
    const statsMap = await getYouTubeVideosStatsBatch(videoIds);

    const updates = [];

    for (const clip of youtubeClips) {
      try {
        const stats = statsMap.get(clip.videoId);

        if (stats) {
          const newViews = stats.views;
          const viewsGained = newViews - clip.viewsAtSubmission;

          // Calculate earnings
          let earnings =
            (viewsGained / 1000) * Number(clip.campaign.ratePerMil);

          // Apply max payout per clip if set
          if (clip.campaign.maxPayoutPerClip) {
            earnings = Math.min(
              earnings,
              Number(clip.campaign.maxPayoutPerClip)
            );
          }

          // Check if campaign has enough budget
          const budgetRemaining =
            Number(clip.campaign.budget) - Number(clip.campaign.spent);
          earnings = Math.min(earnings, budgetRemaining);

          // Calculate the delta (new earnings - old earnings)
          const earningsDelta = earnings - Number(clip.earnings);

          if (earningsDelta > 0) {
            // Use transaction to ensure atomicity of all updates
            await db.transaction(async (tx) => {
              // Update clip
              await tx
                .update(clips)
                .set({
                  currentViews: newViews,
                  earnings: String(earnings),
                  updatedAt: new Date(),
                })
                .where(eq(clips.id, clip.id));

              // Update campaign spent
              await tx
                .update(campaigns)
                .set({
                  spent: sql`${campaigns.spent} + ${earningsDelta}`,
                  updatedAt: new Date(),
                })
                .where(eq(campaigns.id, clip.campaignId));

              // Update clipper balance
              await tx
                .update(users)
                .set({
                  balance: sql`${users.balance} + ${earningsDelta}`,
                  updatedAt: new Date(),
                })
                .where(eq(users.id, clip.clipperId));
            });

            updates.push({
              clipId: clip.id,
              oldViews: clip.currentViews,
              newViews,
              earnings,
            });
          }
        }
      } catch (error) {
        console.error(`Error updating clip ${clip.id}:`, error);
      }
    }

    return NextResponse.json({
      success: true,
      updated: updates.length,
      updates,
    });
  } catch (error) {
    console.error("Error updating views:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
