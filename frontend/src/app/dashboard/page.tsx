"use client";
import * as React from "react";
import Link from "next/link";
import { ArrowRight, FileText, Sparkles, Upload } from "lucide-react";
import { api } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/components/providers/auth-provider";
import type { Report } from "@/lib/types";

export default function DashboardOverview(): React.ReactElement {
  const { user } = useAuth();
  const [reports, setReports] = React.useState<Report[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    api
      .get<{ reports: Report[] }>("/reports")
      .then(({ data }) => setReports(data.reports))
      .catch(() => setReports([]))
      .finally(() => setLoading(false));
  }, []);

  const completed = reports.filter((r) => r.status === "COMPLETED").length;
  const inProgress = reports.filter((r) => r.status !== "COMPLETED" && r.status !== "FAILED").length;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Привет, {user?.name ?? user?.email}</h1>
        <p className="text-muted-foreground mt-1">Тариф: <span className="font-medium text-foreground">{user?.plan}</span></p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardDescription>Всего рефератов</CardDescription>
            <CardTitle className="text-3xl">{reports.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Готовых</CardDescription>
            <CardTitle className="text-3xl">{completed}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>В работе</CardDescription>
            <CardTitle className="text-3xl">{inProgress}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-primary/40">
          <CardHeader>
            <div className="grid h-10 w-10 place-items-center rounded-md refmaster-gradient text-white">
              <Sparkles className="h-5 w-5" />
            </div>
            <CardTitle className="mt-2">Создать новый реферат</CardTitle>
            <CardDescription>Опишите тему — AI сделает остальное.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/dashboard/create">
                Начать <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <div className="grid h-10 w-10 place-items-center rounded-md bg-secondary">
              <Upload className="h-5 w-5" />
            </div>
            <CardTitle className="mt-2">Загрузить шаблон</CardTitle>
            <CardDescription>DOCX или PDF — AI извлечёт стиль оформления.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline">
              <Link href="/dashboard/templates">Управлять шаблонами</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <div>
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Последние рефераты</h2>
          <Button asChild variant="ghost" size="sm">
            <Link href="/dashboard/history">
              Вся история <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </div>
        <div className="mt-4 grid gap-3">
          {loading && <div className="text-muted-foreground text-sm">Загрузка…</div>}
          {!loading && reports.length === 0 && (
            <Card><CardContent className="py-10 text-center text-muted-foreground">Пока нет рефератов. Создайте первый!</CardContent></Card>
          )}
          {reports.slice(0, 5).map((r) => (
            <Link key={r.id} href={`/dashboard/reports/${r.id}`}>
              <Card className="hover:border-primary/40 transition-colors">
                <CardContent className="flex items-center justify-between gap-4 p-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <FileText className="h-5 w-5 text-muted-foreground shrink-0" />
                    <div className="min-w-0">
                      <div className="font-medium truncate">{r.topic}</div>
                      <div className="text-xs text-muted-foreground truncate">{r.discipline} · {r.pages} стр · {r.language}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant={r.status === "COMPLETED" ? "success" : r.status === "FAILED" ? "destructive" : "secondary"}>
                      {r.status}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
