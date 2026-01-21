"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Megaphone,
  Compass,
  Film,
  ClipboardCheck,
  Wallet,
  Settings,
  Menu,
  Scissors,
  LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@/db/schema";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, exact: true },
  { name: "Minhas Campanhas", href: "/dashboard/campaigns", icon: Megaphone },
  { name: "Explorar", href: "/dashboard/explore", icon: Compass },
  { name: "Meus Clips", href: "/dashboard/clips", icon: Film },
  { name: "Submissões", href: "/dashboard/submissions", icon: ClipboardCheck },
  { name: "Carteira", href: "/dashboard/wallet", icon: Wallet },
  { name: "Configurações", href: "/dashboard/settings", icon: Settings },
];

interface SidebarProps {
  user: User;
}

function NavItems({ onItemClick }: { onItemClick?: () => void }) {
  const pathname = usePathname();

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  };

  return (
    <nav className="flex flex-col gap-1">
      {navigation.map((item) => {
        const active = isActive(item.href, item.exact);
        return (
          <Link
            key={item.name}
            href={item.href}
            onClick={onItemClick}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              active
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            )}
          >
            <item.icon className="h-5 w-5" />
            {item.name}
          </Link>
        );
      })}
    </nav>
  );
}

export function Sidebar({ user }: SidebarProps) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  const userInitials =
    user.name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || user.email[0].toUpperCase();

  return (
    <>
      {/* Mobile */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="fixed left-4 top-4 z-50 lg:hidden"
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Abrir menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-72 bg-sidebar p-0">
          <div className="flex h-full flex-col">
            <div className="flex items-center gap-2 border-b border-sidebar-border px-6 py-5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
                <Scissors className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold tracking-tight">Klipei</span>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-4">
              <NavItems onItemClick={() => setOpen(false)} />
            </div>
            <div className="border-t border-sidebar-border p-4">
              <div className="flex items-center gap-3 rounded-lg bg-secondary px-3 py-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/20 text-primary">
                  <span className="text-sm font-semibold">{userInitials}</span>
                </div>
                <div className="flex-1 overflow-hidden">
                  <p className="truncate text-sm font-medium">
                    {user.name || "Usuário"}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {user.email}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                className="mt-2 w-full justify-start text-muted-foreground hover:text-destructive"
                onClick={handleLogout}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sair
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Desktop */}
      <aside className="fixed left-0 top-0 z-40 hidden h-screen w-64 border-r border-sidebar-border bg-sidebar lg:block">
        <div className="flex h-full flex-col">
          <div className="flex items-center gap-2 border-b border-sidebar-border px-6 py-5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <Scissors className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold tracking-tight">Klipei</span>
          </div>
          <div className="flex-1 overflow-y-auto px-4 py-4">
            <NavItems />
          </div>
          <div className="border-t border-sidebar-border p-4">
            <div className="flex items-center gap-3 rounded-lg bg-secondary px-3 py-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/20 text-primary">
                <span className="text-sm font-semibold">{userInitials}</span>
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="truncate text-sm font-medium">
                  {user.name || "Usuário"}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {user.email}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              className="mt-2 w-full justify-start text-muted-foreground hover:text-destructive"
              onClick={handleLogout}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sair
            </Button>
          </div>
        </div>
      </aside>
    </>
  );
}
