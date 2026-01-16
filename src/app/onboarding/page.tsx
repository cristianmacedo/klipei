"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";

export default function OnboardingPage() {
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<
    "CREATOR" | "CLIPPER" | null
  >(null);
  const router = useRouter();

  const handleSubmit = async () => {
    if (!selectedRole) {
      toast.error("Selecione um perfil");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/users/role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: selectedRole }),
      });

      if (!response.ok) {
        const data = await response.json();
        toast.error(data.error || "Erro ao salvar perfil");
        return;
      }

      toast.success("Perfil configurado com sucesso!");
      router.push("/dashboard");
      router.refresh();
    } catch {
      toast.error("Erro ao salvar perfil");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-900 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Bem-vindo ao Klipei!
          </h1>
          <p className="text-zinc-400">Como você quer começar?</p>
          <p className="text-xs text-zinc-500 mt-2">
            Não se preocupe — você pode alternar entre os modos a qualquer
            momento
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Creator Card */}
          <Card
            className={`cursor-pointer transition-all bg-zinc-800 border-2 ${
              selectedRole === "CREATOR"
                ? "border-emerald-500 bg-emerald-900/20"
                : "border-zinc-700 hover:border-zinc-600"
            }`}
            onClick={() => setSelectedRole("CREATOR")}
          >
            <CardHeader>
              <div className="w-12 h-12 rounded-full bg-emerald-600/20 flex items-center justify-center mb-4">
                <svg
                  className="w-6 h-6 text-emerald-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
              </div>
              <CardTitle className="text-white">Criador / Marca</CardTitle>
              <CardDescription className="text-zinc-400">
                Quero criar campanhas e pagar clippers para divulgar meu
                conteúdo
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-zinc-400 space-y-2">
                <li className="flex items-center gap-2">
                  <span className="text-emerald-400">✓</span> Criar campanhas
                  ilimitadas
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-400">✓</span> Definir seu
                  próprio orçamento
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-400">✓</span> Pagar apenas por
                  views reais
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Clipper Card */}
          <Card
            className={`cursor-pointer transition-all bg-zinc-800 border-2 ${
              selectedRole === "CLIPPER"
                ? "border-emerald-500 bg-emerald-900/20"
                : "border-zinc-700 hover:border-zinc-600"
            }`}
            onClick={() => setSelectedRole("CLIPPER")}
          >
            <CardHeader>
              <div className="w-12 h-12 rounded-full bg-emerald-600/20 flex items-center justify-center mb-4">
                <svg
                  className="w-6 h-6 text-emerald-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <CardTitle className="text-white">Clipper</CardTitle>
              <CardDescription className="text-zinc-400">
                Quero criar conteúdo e ganhar dinheiro por visualizações
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-zinc-400 space-y-2">
                <li className="flex items-center gap-2">
                  <span className="text-emerald-400">✓</span> Acesso a todas as
                  campanhas
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-400">✓</span> Ganhe por 1.000
                  views
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-400">✓</span> Saque via PIX
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8 text-center">
          <Button
            size="lg"
            className="bg-emerald-600 hover:bg-emerald-700 px-8"
            disabled={!selectedRole || loading}
            onClick={handleSubmit}
          >
            {loading ? "Salvando..." : "Continuar"}
          </Button>
          <p className="text-xs text-zinc-500 mt-4">
            Você pode trocar de modo a qualquer momento pelo menu no topo
          </p>
        </div>
      </div>
    </div>
  );
}
