"use client";

import { useRouter, usePathname } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { UserRole } from "@/types";

interface RoleSwitcherProps {
  currentRole: UserRole | null;
}

export function RoleSwitcher({ currentRole }: RoleSwitcherProps) {
  const router = useRouter();
  const pathname = usePathname();

  const isCreatorMode = currentRole === "CREATOR" || pathname.includes("/creator");
  const isClipperMode = currentRole === "CLIPPER" || pathname.includes("/clipper");

  // Determine active mode based on current path or role
  const activeMode = pathname.includes("/creator")
    ? "CREATOR"
    : pathname.includes("/clipper")
      ? "CLIPPER"
      : currentRole || "CREATOR";

  const switchMode = async (newMode: UserRole) => {
    if (newMode === activeMode) return;

    // Update role in DB
    try {
      const response = await fetch("/api/users/role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newMode }),
      });

      if (!response.ok) {
        toast.error("Erro ao trocar modo");
        return;
      }

      // Navigate to the appropriate dashboard
      if (newMode === "CREATOR") {
        router.push("/dashboard/creator");
      } else {
        router.push("/dashboard/clipper");
      }

      toast.success(
        newMode === "CREATOR" ? "Modo Criador ativado" : "Modo Clipper ativado"
      );
      router.refresh();
    } catch {
      toast.error("Erro ao trocar modo");
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="border-zinc-700 bg-zinc-800 hover:bg-zinc-700 gap-2"
        >
          {activeMode === "CREATOR" ? (
            <>
              <span className="text-amber-400">🎬</span>
              <span className="text-zinc-200">Criador</span>
            </>
          ) : (
            <>
              <span className="text-emerald-400">✂️</span>
              <span className="text-zinc-200">Clipper</span>
            </>
          )}
          <span className="text-zinc-500 ml-1">▾</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="bg-zinc-800 border-zinc-700" align="start">
        <DropdownMenuItem
          className={`cursor-pointer ${
            activeMode === "CREATOR"
              ? "bg-zinc-700 text-white"
              : "text-zinc-300 focus:bg-zinc-700 focus:text-white"
          }`}
          onClick={() => switchMode("CREATOR")}
        >
          <span className="mr-2">🎬</span>
          Modo Criador
          {activeMode === "CREATOR" && (
            <span className="ml-auto text-emerald-400">✓</span>
          )}
        </DropdownMenuItem>
        <DropdownMenuItem
          className={`cursor-pointer ${
            activeMode === "CLIPPER"
              ? "bg-zinc-700 text-white"
              : "text-zinc-300 focus:bg-zinc-700 focus:text-white"
          }`}
          onClick={() => switchMode("CLIPPER")}
        >
          <span className="mr-2">✂️</span>
          Modo Clipper
          {activeMode === "CLIPPER" && (
            <span className="ml-auto text-emerald-400">✓</span>
          )}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
