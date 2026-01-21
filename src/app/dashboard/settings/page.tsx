"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface UserData {
  id: string;
  name: string | null;
  email: string;
  pixKey: string | null;
  avatarUrl: string | null;
  balance: string;
}

export default function SettingsPage() {
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [pixKey, setPixKey] = useState("");
  const router = useRouter();

  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = async () => {
    try {
      const response = await fetch("/api/users/me");
      const data = await response.json();

      if (response.ok) {
        setUser(data.user);
        setName(data.user.name || "");
        setPixKey(data.user.pixKey || "");
      }
    } catch {
      toast.error("Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const response = await fetch("/api/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, pixKey }),
      });

      if (!response.ok) {
        const data = await response.json();
        toast.error(data.error || "Erro ao salvar");
        return;
      }

      toast.success("Configurações salvas!");
      router.refresh();
    } catch {
      toast.error("Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight lg:text-3xl">
          Configurações
        </h1>
        <p className="mt-1 text-muted-foreground">Gerencie seu perfil</p>
      </div>

      {/* Quick Link to Wallet */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Carteira</p>
              <p className="text-sm text-muted-foreground">
                Saldo: R$ {Number(user?.balance || 0).toFixed(2)}
              </p>
            </div>
            <Link href="/dashboard/wallet">
              <Button variant="outline">Gerenciar Carteira</Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      <form onSubmit={handleSave}>
        <Card>
          <CardHeader>
            <CardTitle>Perfil</CardTitle>
            <CardDescription>Suas informações básicas</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={user?.email || ""}
                disabled
              />
              <p className="text-xs text-muted-foreground">
                O email não pode ser alterado
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="pixKey">Chave PIX</Label>
              <Input
                id="pixKey"
                type="text"
                value={pixKey}
                onChange={(e) => setPixKey(e.target.value)}
                placeholder="CPF, email, telefone ou chave aleatória"
              />
              <p className="text-xs text-muted-foreground">
                Usada para receber seus pagamentos (saques)
              </p>
            </div>

            <Button type="submit" disabled={saving}>
              {saving ? "Salvando..." : "Salvar alterações"}
            </Button>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
