export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { db, users, campaigns, clips } from "@/db";
import { eq, desc, count } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default async function CreatorDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const dbUser = await db.query.users.findFirst({
    where: eq(users.id, user.id),
  });

  if (!dbUser) {
    redirect("/onboarding");
  }

  // Get campaigns with clips
  const userCampaigns = await db.query.campaigns.findMany({
    where: eq(campaigns.creatorId, user.id),
    with: {
      clips: true,
    },
  });

  const totalCampaigns = userCampaigns.length;
  const activeCampaigns = userCampaigns.filter(
    (c) => c.status === "ACTIVE"
  ).length;
  const totalBudget = userCampaigns.reduce(
    (acc, c) => acc + Number(c.budget),
    0
  );
  const totalSpent = userCampaigns.reduce((acc, c) => acc + Number(c.spent), 0);

  // Get pending submissions count
  const allClips = userCampaigns.flatMap((c) => c.clips);
  const pendingSubmissions = allClips.filter(
    (c) => c.status === "PENDING"
  ).length;

  // Get recent submissions
  const recentSubmissions = await db.query.clips.findMany({
    where: eq(clips.status, "PENDING"),
    with: {
      campaign: true,
      clipper: true,
    },
    orderBy: [desc(clips.submittedAt)],
    limit: 5,
  });

  // Filter only clips from this creator's campaigns
  const creatorClips = recentSubmissions.filter((clip) =>
    userCampaigns.some((c) => c.id === clip.campaignId)
  );

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Dashboard</h1>
          <p className="text-zinc-400">
            Bem-vindo de volta, {dbUser.name || "Criador"}!
          </p>
        </div>
        <Link href="/campaigns/new">
          <Button className="bg-emerald-600 hover:bg-emerald-700">
            Nova Campanha
          </Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-zinc-800 border-zinc-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">
              Campanhas Ativas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-white">{activeCampaigns}</p>
            <p className="text-xs text-zinc-500">{totalCampaigns} total</p>
          </CardContent>
        </Card>

        <Card className="bg-zinc-800 border-zinc-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">
              Orçamento Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-white">
              R$ {totalBudget.toFixed(2)}
            </p>
            <p className="text-xs text-zinc-500">
              R$ {totalSpent.toFixed(2)} gasto
            </p>
          </CardContent>
        </Card>

        <Card className="bg-zinc-800 border-zinc-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">
              Submissões Pendentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-emerald-400">
              {pendingSubmissions}
            </p>
            <p className="text-xs text-zinc-500">aguardando revisão</p>
          </CardContent>
        </Card>

        <Card className="bg-zinc-800 border-zinc-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">
              Orçamento Restante
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-white">
              R$ {(totalBudget - totalSpent).toFixed(2)}
            </p>
            <p className="text-xs text-zinc-500">disponível</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Submissions */}
      <Card className="bg-zinc-800 border-zinc-700">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-white">Submissões Recentes</CardTitle>
          <Link href="/dashboard/creator/submissions">
            <Button
              variant="ghost"
              size="sm"
              className="text-zinc-400 hover:text-white"
            >
              Ver todas
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {creatorClips.length === 0 ? (
            <p className="text-zinc-500 text-center py-8">
              Nenhuma submissão ainda. Crie uma campanha para começar!
            </p>
          ) : (
            <div className="space-y-4">
              {creatorClips.map((clip) => (
                <div
                  key={clip.id}
                  className="flex items-center justify-between p-4 rounded-lg bg-zinc-700/50"
                >
                  <div className="flex-1">
                    <p className="text-white font-medium">
                      {clip.campaign.title}
                    </p>
                    <p className="text-sm text-zinc-400">
                      por {clip.clipper.name || clip.clipper.email}
                    </p>
                  </div>
                  <div className="text-right">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        clip.status === "PENDING"
                          ? "bg-yellow-500/20 text-yellow-400"
                          : clip.status === "APPROVED"
                          ? "bg-emerald-500/20 text-emerald-400"
                          : "bg-red-500/20 text-red-400"
                      }`}
                    >
                      {clip.status === "PENDING"
                        ? "Pendente"
                        : clip.status === "APPROVED"
                        ? "Aprovado"
                        : "Rejeitado"}
                    </span>
                    <p className="text-xs text-zinc-500 mt-1">
                      {new Date(clip.submittedAt).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
