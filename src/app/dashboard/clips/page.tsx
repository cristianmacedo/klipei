export const dynamic = "force-dynamic";

import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { db, clips } from "@/db";
import { eq, desc } from "drizzle-orm";
import { Button } from "@/components/ui/button";
import { Eye, TrendingUp, CheckCircle2 } from "lucide-react";
import { SubmitClipModal } from "@/components/dashboard/submit-clip-modal";
import { ClipsTable } from "@/components/dashboard/clips-table";

export default async function ClipsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // Get user's clips (as clipper)
  const userClips = await db.query.clips.findMany({
    where: eq(clips.clipperId, user.id),
    with: {
      campaign: {
        with: {
          creator: true,
        },
      },
    },
    orderBy: [desc(clips.submittedAt)],
  });

  // Stats
  const totalViews = userClips.reduce((acc, c) => acc + c.currentViews, 0);
  const totalEarnings = userClips.reduce(
    (acc, c) => acc + Number(c.earnings),
    0
  );
  const approvedClips = userClips.filter((c) => c.status === "APPROVED");

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight lg:text-3xl">
            Meus Clips
          </h1>
          <p className="mt-1 text-muted-foreground">
            Acompanhe o desempenho dos seus clips submetidos.
          </p>
        </div>
        <SubmitClipModal />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/20 text-primary">
              <Eye className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total de views</p>
              <p className="text-2xl font-bold">
                {totalViews >= 1000
                  ? `${(totalViews / 1000).toFixed(1)}k`
                  : totalViews}
              </p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-success/20 text-success">
              <TrendingUp className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Ganhos totais</p>
              <p className="text-2xl font-bold">R$ {totalEarnings.toFixed(2)}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent/20 text-accent">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Clips submetidos</p>
              <p className="text-2xl font-bold">
                {userClips.length}
                <span className="text-base font-normal text-muted-foreground ml-2">
                  {approvedClips.length} aprovados
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Clips Table */}
      {userClips.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16">
          <p className="text-muted-foreground mb-2">
            Você ainda não submeteu nenhum clip.
          </p>
          <p className="text-sm text-muted-foreground mb-4">
            Explore campanhas e comece a ganhar por views.
          </p>
          <div className="flex gap-3">
            <Link href="/dashboard/explore">
              <Button variant="secondary">Explorar campanhas</Button>
            </Link>
            <SubmitClipModal />
          </div>
        </div>
      ) : (
        <ClipsTable clips={userClips} />
      )}
    </div>
  );
}
