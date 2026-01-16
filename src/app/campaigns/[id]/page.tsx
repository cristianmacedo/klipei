export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Link from "next/link";
import { db, campaigns, users } from "@/db";
import { eq } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SubmitClipButton } from "@/components/submit-clip-button";

interface CampaignPageProps {
  params: Promise<{ id: string }>;
}

export default async function CampaignPage({ params }: CampaignPageProps) {
  const { id } = await params;

  const campaign = await db.query.campaigns.findFirst({
    where: eq(campaigns.id, id),
    with: {
      creator: true,
      clips: true,
    },
  });

  if (!campaign) {
    notFound();
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let dbUser = null;
  if (user) {
    dbUser = await db.query.users.findFirst({
      where: eq(users.id, user.id),
    });
  }

  const isClipper = dbUser?.role === "CLIPPER";
  const isCreator =
    dbUser?.role === "CREATOR" && dbUser.id === campaign.creatorId;
  const budgetRemaining = Number(campaign.budget) - Number(campaign.spent);

  return (
    <div className="min-h-screen bg-zinc-900">
      {/* Header */}
      <header className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="text-xl font-bold text-white">
              Klipei
            </Link>
            <div className="flex items-center gap-4">
              {user ? (
                <Link href="/dashboard">
                  <Button
                    variant="ghost"
                    className="text-zinc-400 hover:text-white"
                  >
                    Dashboard
                  </Button>
                </Link>
              ) : (
                <>
                  <Link href="/login">
                    <Button
                      variant="ghost"
                      className="text-zinc-400 hover:text-white"
                    >
                      Entrar
                    </Button>
                  </Link>
                  <Link href="/signup">
                    <Button className="bg-emerald-600 hover:bg-emerald-700">
                      Criar conta
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Link
          href="/campaigns"
          className="text-zinc-400 hover:text-white text-sm mb-6 inline-block"
        >
          ← Voltar para campanhas
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <div>
              <div className="flex items-start justify-between gap-4 mb-2">
                <h1 className="text-3xl font-bold text-white">
                  {campaign.title}
                </h1>
                <Badge
                  variant="secondary"
                  className={`${
                    campaign.status === "ACTIVE"
                      ? "bg-emerald-600/20 text-emerald-400"
                      : "bg-zinc-600/20 text-zinc-400"
                  } border-0`}
                >
                  {campaign.status}
                </Badge>
              </div>
              <p className="text-zinc-400">
                por {campaign.creator.name || campaign.creator.email}
              </p>
            </div>

            <Card className="bg-zinc-800 border-zinc-700">
              <CardHeader>
                <CardTitle className="text-white">Descrição</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-zinc-300 whitespace-pre-wrap">
                  {campaign.description}
                </p>
              </CardContent>
            </Card>

            {campaign.instructions && (
              <Card className="bg-zinc-800 border-zinc-700">
                <CardHeader>
                  <CardTitle className="text-white">Instruções</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-zinc-300 whitespace-pre-wrap">
                    {campaign.instructions}
                  </p>
                </CardContent>
              </Card>
            )}

            {campaign.sourceContent && (
              <Card className="bg-zinc-800 border-zinc-700">
                <CardHeader>
                  <CardTitle className="text-white">Conteúdo Fonte</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-zinc-300 whitespace-pre-wrap">
                    {campaign.sourceContent}
                  </p>
                </CardContent>
              </Card>
            )}

            {campaign.requirements.length > 0 && (
              <Card className="bg-zinc-800 border-zinc-700">
                <CardHeader>
                  <CardTitle className="text-white">Requisitos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {campaign.requirements.map((req, i) => (
                      <Badge
                        key={i}
                        variant="secondary"
                        className="bg-zinc-700 text-zinc-300"
                      >
                        {req}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card className="bg-zinc-800 border-zinc-700">
              <CardHeader>
                <CardTitle className="text-white">Recompensa</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-4xl font-bold text-emerald-400">
                    R$ {Number(campaign.ratePerMil).toFixed(2)}
                  </p>
                  <p className="text-zinc-500">por 1.000 views</p>
                </div>

                {campaign.maxPayoutPerClip && (
                  <div className="text-sm text-zinc-400">
                    Máximo por clip: R${" "}
                    {Number(campaign.maxPayoutPerClip).toFixed(2)}
                  </div>
                )}

                <Separator className="bg-zinc-700" />

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Tipo</span>
                    <span className="text-white">{campaign.type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Orçamento restante</span>
                    <span className="text-white">
                      R$ {budgetRemaining.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Clips submetidos</span>
                    <span className="text-white">{campaign.clips.length}</span>
                  </div>
                </div>

                <Separator className="bg-zinc-700" />

                <div>
                  <p className="text-sm text-zinc-400 mb-2">
                    Plataformas aceitas
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {campaign.platforms.map((platform) => (
                      <Badge
                        key={platform}
                        variant="outline"
                        className="border-zinc-600 text-zinc-400"
                      >
                        {platform}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            {campaign.status === "ACTIVE" && (
              <Card className="bg-zinc-800 border-zinc-700">
                <CardContent className="pt-6">
                  {!user ? (
                    <div className="text-center">
                      <p className="text-zinc-400 mb-4">
                        Faça login para participar desta campanha
                      </p>
                      <Link
                        href={`/login?redirectTo=/campaigns/${campaign.id}`}
                      >
                        <Button className="w-full bg-emerald-600 hover:bg-emerald-700">
                          Entrar
                        </Button>
                      </Link>
                    </div>
                  ) : isClipper ? (
                    <SubmitClipButton campaignId={campaign.id} />
                  ) : isCreator ? (
                    <Link href={`/dashboard/creator/campaigns/${campaign.id}`}>
                      <Button className="w-full" variant="outline">
                        Gerenciar Campanha
                      </Button>
                    </Link>
                  ) : (
                    <p className="text-zinc-400 text-center text-sm">
                      Apenas clippers podem submeter conteúdo
                    </p>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
