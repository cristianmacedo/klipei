export const dynamic = "force-dynamic";

import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { db, campaigns, clips } from "@/db";
import { eq, desc } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SubmissionsListUnified } from "@/components/submissions-list-unified";

interface SubmissionsPageProps {
  searchParams: Promise<{ tab?: string }>;
}

export default async function SubmissionsPage({
  searchParams,
}: SubmissionsPageProps) {
  const { tab } = await searchParams;
  const defaultTab = tab === "enviadas" ? "enviadas" : "recebidas";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // Get user's campaigns (to find received submissions)
  const userCampaigns = await db.query.campaigns.findMany({
    where: eq(campaigns.creatorId, user.id),
  });

  const campaignIds = userCampaigns.map((c) => c.id);

  // Get all clips
  const allClips = await db.query.clips.findMany({
    with: {
      campaign: {
        with: {
          creator: true,
        },
      },
      clipper: true,
    },
    orderBy: [desc(clips.submittedAt)],
  });

  // Received submissions (clips on user's campaigns)
  const receivedClips = allClips.filter((clip) =>
    campaignIds.includes(clip.campaignId)
  );

  // Sent submissions (clips submitted by user)
  const sentClips = allClips.filter((clip) => clip.clipperId === user.id);

  // Stats
  const receivedPending = receivedClips.filter(
    (c) => c.status === "PENDING"
  ).length;
  const sentPending = sentClips.filter((c) => c.status === "PENDING").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Submissões</h1>
        <p className="text-zinc-400">
          Gerencie submissões recebidas e enviadas
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-zinc-800 border-zinc-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">
              Recebidas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-white">
              {receivedClips.length}
            </p>
            <p className="text-xs text-zinc-500">
              {receivedPending} pendentes
            </p>
          </CardContent>
        </Card>

        <Card className="bg-zinc-800 border-zinc-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">
              Enviadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-white">{sentClips.length}</p>
            <p className="text-xs text-zinc-500">{sentPending} pendentes</p>
          </CardContent>
        </Card>

        <Card className="bg-zinc-800 border-zinc-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">
              Aprovadas (Recebidas)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-emerald-400">
              {receivedClips.filter((c) => c.status === "APPROVED").length}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-zinc-800 border-zinc-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">
              Aprovadas (Enviadas)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-emerald-400">
              {sentClips.filter((c) => c.status === "APPROVED").length}
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue={defaultTab} className="space-y-6">
        <TabsList className="bg-zinc-800 border-zinc-700">
          <TabsTrigger
            value="recebidas"
            className="data-[state=active]:bg-zinc-700"
          >
            Recebidas ({receivedClips.length})
          </TabsTrigger>
          <TabsTrigger
            value="enviadas"
            className="data-[state=active]:bg-zinc-700"
          >
            Enviadas ({sentClips.length})
          </TabsTrigger>
        </TabsList>

        {/* Received Tab */}
        <TabsContent value="recebidas">
          {receivedClips.length === 0 ? (
            <Card className="bg-zinc-800 border-zinc-700">
              <CardContent className="py-12 text-center">
                <p className="text-zinc-500 mb-2">
                  Nenhuma submissão recebida ainda.
                </p>
                <p className="text-zinc-600 text-sm">
                  Crie uma campanha para começar a receber submissões de
                  clippers.
                </p>
                <Link
                  href="/dashboard/campaigns/new"
                  className="text-emerald-400 hover:underline text-sm mt-4 inline-block"
                >
                  Criar campanha →
                </Link>
              </CardContent>
            </Card>
          ) : (
            <SubmissionsListUnified
              clips={receivedClips}
              mode="received"
              showCampaign={true}
            />
          )}
        </TabsContent>

        {/* Sent Tab */}
        <TabsContent value="enviadas">
          {sentClips.length === 0 ? (
            <Card className="bg-zinc-800 border-zinc-700">
              <CardContent className="py-12 text-center">
                <p className="text-zinc-500 mb-2">
                  Você ainda não enviou nenhuma submissão.
                </p>
                <p className="text-zinc-600 text-sm">
                  Explore campanhas e submeta seus clips para ganhar.
                </p>
                <Link
                  href="/dashboard/campaigns"
                  className="text-emerald-400 hover:underline text-sm mt-4 inline-block"
                >
                  Explorar campanhas →
                </Link>
              </CardContent>
            </Card>
          ) : (
            <SubmissionsListUnified
              clips={sentClips}
              mode="sent"
              showCampaign={true}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
