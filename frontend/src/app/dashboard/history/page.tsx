"use client";
import * as React from "react";
import Link from "next/link";
import { FileText, Trash2 } from "lucide-react";
import { api } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Report } from "@/lib/types";

export default function HistoryPage(): React.ReactElement {
  const [reports, setReports] = React.useState<Report[]>([]);
  const [loading, setLoading] = React.useState(true);

  const refresh = async (): Promise<void> => {
    const { data } = await api.get<{ reports: Report[] }>("/reports");
    setReports(data.reports);
  };

  React.useEffect(() => {
    void refresh().finally(() => setLoading(false));
  }, []);

  const remove = async (id: string): Promise<void> => {
    if (!confirm("Удалить реферат и все файлы?")) return;
    await api.delete(`/reports/${id}`);
    await refresh();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">История</h1>
        <p className="text-muted-foreground mt-1">Все ваши сгенерированные рефераты.</p>
      </div>

      <div className="grid gap-3">
        {loading && <div className="text-sm text-muted-foreground">Загрузка…</div>}
        {!loading && reports.length === 0 && <div className="text-sm text-muted-foreground">Пока ничего нет.</div>}
        {reports.map((r) => (
          <Card key={r.id} className="hover:border-primary/40 transition-colors">
            <CardContent className="flex items-center justify-between gap-4 p-4">
              <Link href={`/dashboard/reports/${r.id}`} className="flex items-center gap-3 min-w-0 flex-1">
                <FileText className="h-5 w-5 text-muted-foreground shrink-0" />
                <div className="min-w-0">
                  <div className="font-medium truncate">{r.topic}</div>
                  <div className="text-xs text-muted-foreground truncate">
                    {r.discipline} · {r.pages} стр · {r.language} · {new Date(r.createdAt).toLocaleString()}
                  </div>
                </div>
              </Link>
              <div className="flex items-center gap-2 shrink-0">
                <Badge variant={r.status === "COMPLETED" ? "success" : r.status === "FAILED" ? "destructive" : "secondary"}>
                  {r.status}
                </Badge>
                <Button size="icon" variant="ghost" onClick={() => void remove(r.id)} aria-label="Удалить">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
