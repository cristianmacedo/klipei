"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { RoleSwitcher } from "@/components/role-switcher";
import type { User } from "@/db/schema";

interface DashboardNavProps {
  user: User;
}

export function DashboardNav({ user }: DashboardNavProps) {
  const pathname = usePathname();
  const router = useRouter();

  // Determine active mode based on current path
  const isCreatorMode = pathname.includes("/creator") || pathname === "/campaigns/new";
  const isClipperMode = pathname.includes("/clipper");

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  // Show nav items based on current mode (path), not stored role
  const creatorNavItems = [
    { href: "/dashboard/creator", label: "Dashboard" },
    { href: "/dashboard/creator/campaigns", label: "Campanhas" },
    { href: "/dashboard/creator/submissions", label: "Submissões" },
  ];

  const clipperNavItems = [
    { href: "/dashboard/clipper", label: "Dashboard" },
    { href: "/campaigns", label: "Campanhas" },
    { href: "/dashboard/clipper/submissions", label: "Minhas Submissões" },
    { href: "/dashboard/clipper/earnings", label: "Ganhos" },
  ];

  const navItems = isCreatorMode ? creatorNavItems : clipperNavItems;

  return (
    <header className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo + Mode Switcher */}
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-xl font-bold text-white">
              Klipei
            </Link>
            <RoleSwitcher currentRole={user.role} />
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`text-sm transition-colors ${
                  pathname === item.href
                    ? "text-emerald-400"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* User Menu */}
          <div className="flex items-center gap-4">
            {isCreatorMode && (
              <Link href="/campaigns/new">
                <Button
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  Nova Campanha
                </Button>
              </Link>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-8 w-8 rounded-full"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage
                      src={user.avatarUrl || undefined}
                      alt={user.name || ""}
                    />
                    <AvatarFallback className="bg-emerald-600">
                      {user.name?.[0]?.toUpperCase() ||
                        user.email[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-56 bg-zinc-800 border-zinc-700"
                align="end"
              >
                <div className="flex items-center justify-start gap-2 p-2">
                  <div className="flex flex-col space-y-1 leading-none">
                    {user.name && (
                      <p className="font-medium text-white">{user.name}</p>
                    )}
                    <p className="w-[200px] truncate text-sm text-zinc-400">
                      {user.email}
                    </p>
                  </div>
                </div>
                <DropdownMenuSeparator className="bg-zinc-700" />
                <DropdownMenuItem
                  className="text-zinc-300 focus:bg-zinc-700 focus:text-white cursor-pointer"
                  asChild
                >
                  <Link href="/dashboard/settings">Configurações</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-zinc-700" />
                <DropdownMenuItem
                  className="text-red-400 focus:bg-zinc-700 focus:text-red-400 cursor-pointer"
                  onClick={handleLogout}
                >
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
}
