"use client";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { ThemeToggle } from "./theme-toggle";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/providers/auth-provider";

export function SiteHeader(): React.ReactElement {
  const { user, logout } = useAuth();
  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <span className="grid h-8 w-8 place-items-center rounded-md refmaster-gradient text-white">
            <Sparkles className="h-4 w-4" />
          </span>
          <span className="text-lg">RefMaster <span className="refmaster-gradient-text">AI</span></span>
        </Link>
        <nav className="hidden md:flex items-center gap-6 text-sm">
          <Link href="/#features" className="text-muted-foreground hover:text-foreground">Возможности</Link>
          <Link href="/#pipeline" className="text-muted-foreground hover:text-foreground">Pipeline</Link>
          <Link href="/#pricing" className="text-muted-foreground hover:text-foreground">Тарифы</Link>
          <Link href="/dashboard" className="text-muted-foreground hover:text-foreground">Кабинет</Link>
        </nav>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          {user ? (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link href="/dashboard">{user.name ?? user.email}</Link>
              </Button>
              <Button variant="outline" size="sm" onClick={logout}>Выйти</Button>
            </>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link href="/login">Войти</Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/register">Начать бесплатно</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
