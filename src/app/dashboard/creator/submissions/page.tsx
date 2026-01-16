export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { db, users, campaigns, clips } from "@/db";
import { eq, desc } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SubmissionsList } from "@/components/submissions-list";

export default async function CreatorSubmissionsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get creator's campaigns
  const userCampaigns = await db.query.campaigns.findMany({
    where: eq(campaigns.creatorId, user.id),
  });

  const campaignIds = userCampaigns.map((c) => c.id);

  // Get all clips from creator's campaigns
  const allClips = await db.query.clips.findMany({
    with: {
      campaign: true,
      clipper: true,
    },
    orderBy: [desc(clips.submittedAt)],
  });

  // Filter clips from this creator's campaigns
  const creatorClips = allClips.filter((clip) =>
    campaignIds.includes(clip.campaignId)
  );

  const pendingCount = creatorClips.filter(
    (c) => c.status === "PENDING"
  ).length;
  const approvedCount = creatorClips.filter(
    (c) => c.status === "APPROVED"
  ).length;
  const rejectedCount = creatorClips.filter(
    (c) => c.status === "REJECTED"
  ).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Submissões</h1>
        <p className="text-zinc-400">Revise e aprove submissões de clippers</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-zinc-800 border-zinc-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">
              Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-white">
              {creatorClips.length}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-zinc-800 border-zinc-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">
              Pendentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-yellow-400">{pendingCount}</p>
          </CardContent>
        </Card>

        <Card className="bg-zinc-800 border-zinc-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">
              Aprovados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-emerald-400">
              {approvedCount}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-zinc-800 border-zinc-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">
              Rejeitados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-400">{rejectedCount}</p>
          </CardContent>
        </Card>
      </div>

      {/* Submissions */}
      <SubmissionsList clips={creatorClips} isCreator={true} />
    </div>
  );
}
