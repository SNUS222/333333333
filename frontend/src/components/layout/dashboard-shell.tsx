"use client";
import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "./theme-toggle";
import { Button } from "@/components/ui/button";
import {
  History,
  LayoutDashboard,
  PenSquare,
  ShieldCheck,
  Sparkles,
  Settings,
  FileBox,
} from "lucide-react";

const NAV = [
  { href: "/dashboard", label: "Обзор", icon: LayoutDashboard },
  { href: "/dashboard/create", label: "Новый реферат", icon: PenSquare },
  { href: "/dashboard/templates", label: "Шаблоны", icon: FileBox },
  { href: "/dashboard/history", label: "История", icon: History },
  { href: "/dashboard/settings", label: "Настройки", icon: Settings },
];

export function DashboardShell({ children }: { children: React.ReactNode }): React.ReactElement {
  const { user, loading, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  React.useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, user, router]);

  if (loading || !user) {
    return (
      <div className="grid min-h-screen place-items-center text-muted-foreground">Загрузка…</div>
    );
  }

  return (
    <div className="grid min-h-screen grid-rows-[auto_1fr] md:grid-cols-[240px_1fr] md:grid-rows-[auto_1fr]">
      <header className="md:col-span-2 border-b bg-background/80 backdrop-blur z-30">
        <div className="flex h-16 items-center justify-between px-4 md:px-6">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <span className="grid h-8 w-8 place-items-center rounded-md refmaster-gradient text-white">
              <Sparkles className="h-4 w-4" />
            </span>
            <span className="text-lg">RefMaster <span className="refmaster-gradient-text">AI</span></span>
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground hidden md:inline">
              {user.email} · <span className="font-medium text-foreground">{user.plan}</span>
            </span>
            <ThemeToggle />
            <Button variant="outline" size="sm" onClick={logout}>Выйти</Button>
          </div>
        </div>
      </header>
      <aside className="border-r p-3 hidden md:block">
        <nav className="flex flex-col gap-1">
          {NAV.map((item) => {
            const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                  active ? "bg-accent text-accent-foreground" : "hover:bg-accent/60",
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
          {user.role === "ADMIN" && (
            <Link
              href="/dashboard/admin"
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                pathname.startsWith("/dashboard/admin") ? "bg-accent text-accent-foreground" : "hover:bg-accent/60",
              )}
            >
              <ShieldCheck className="h-4 w-4" />
              Админ-панель
            </Link>
          )}
        </nav>
      </aside>
      <main className="p-4 md:p-8">{children}</main>
    </div>
  );
}
