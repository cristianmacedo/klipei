export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { db, clips } from "@/db";
import { eq, desc } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export default async function ClipperSubmissionsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const userClips = await db.query.clips.findMany({
    where: eq(clips.clipperId, user.id),
    with: {
      campaign: true,
    },
    orderBy: [desc(clips.submittedAt)],
  });

  const pendingCount = userClips.filter((c) => c.status === "PENDING").length;
  const approvedCount = userClips.filter((c) => c.status === "APPROVED").length;
  const rejectedCount = userClips.filter((c) => c.status === "REJECTED").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Minhas Submissões</h1>
        <p className="text-zinc-400">Acompanhe o status dos seus clips</p>
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
            <p className="text-2xl font-bold text-white">{userClips.length}</p>
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

      {/* Clips List */}
      <Card className="bg-zinc-800 border-zinc-700">
        <CardHeader>
          <CardTitle className="text-white">Todas as Submissões</CardTitle>
        </CardHeader>
        <CardContent>
          {userClips.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-zinc-500 mb-4">
                Você ainda não submeteu nenhum clip
              </p>
              <Link href="/campaigns">
                <Badge className="bg-emerald-600 hover:bg-emerald-700 cursor-pointer">
                  Encontrar Campanhas
                </Badge>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {userClips.map((clip) => (
                <div
                  key={clip.id}
                  className="p-4 rounded-lg bg-zinc-700/50 hover:bg-zinc-700 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge
                          variant="outline"
                          className="border-zinc-600 text-zinc-400"
                        >
                          {clip.platform}
                        </Badge>
                        <Badge
                          variant="secondary"
                          className={`${
                            clip.status === "PENDING"
                              ? "bg-yellow-500/20 text-yellow-400"
                              : clip.status === "APPROVED"
                              ? "bg-emerald-500/20 text-emerald-400"
                              : "bg-red-500/20 text-red-400"
                          } border-0`}
                        >
                          {clip.status === "PENDING"
                            ? "Pendente"
                            : clip.status === "APPROVED"
                            ? "Aprovado"
                            : "Rejeitado"}
                        </Badge>
                      </div>

                      <Link
                        href={`/campaigns/${clip.campaignId}`}
                        className="text-white font-medium hover:text-emerald-400"
                      >
                        {clip.campaign.title}
                      </Link>

                      <a
                        href={clip.videoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block text-sm text-zinc-400 hover:text-zinc-300 truncate mt-1"
                      >
                        {clip.videoUrl}
                      </a>

                      {clip.status === "APPROVED" && (
                        <div className="mt-2 flex items-center gap-4 text-sm">
                          <span className="text-zinc-400">
                            Views ganhas:{" "}
                            {(
                              clip.currentViews - clip.viewsAtSubmission
                            ).toLocaleString()}
                          </span>
                          <span className="text-emerald-400 font-medium">
                            Ganhos: R$ {Number(clip.earnings).toFixed(2)}
                          </span>
                        </div>
                      )}

                      {clip.status === "REJECTED" && clip.rejectionReason && (
                        <p className="mt-2 text-sm text-red-400">
                          Motivo: {clip.rejectionReason}
                        </p>
                      )}
                    </div>

                    <div className="text-right text-sm text-zinc-500">
                      {new Date(clip.submittedAt).toLocaleDateString("pt-BR")}
                    </div>
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
