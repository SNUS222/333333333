"use client";
import * as React from "react";
import { useParams } from "next/navigation";
import { Download, FileText, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { api, apiBaseUrl, getToken } from "@/lib/api";
import { getSocket } from "@/lib/socket";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { ProgressEvent, Report } from "@/lib/types";

export default function ReportDetailPage(): React.ReactElement {
  const params = useParams<{ id: string }>();
  const reportId = params.id;
  const [report, setReport] = React.useState<Report | null>(null);
  const [progressMsg, setProgressMsg] = React.useState<string>("");
  const [progressVal, setProgressVal] = React.useState<number>(0);

  const fetchReport = React.useCallback(async () => {
    const { data } = await api.get<{ report: Report }>(`/reports/${reportId}`);
    setReport(data.report);
    setProgressVal(data.report.progress);
  }, [reportId]);

  React.useEffect(() => {
    void fetchReport();
    const socket = getSocket();
    socket.emit("subscribe", reportId);
    const onProgress = (ev: ProgressEvent): void => {
      if (ev.reportId !== reportId) return;
      if (typeof ev.progress === "number") setProgressVal(ev.progress);
      if (ev.message) setProgressMsg(ev.message);
      if (ev.status === "COMPLETED" || ev.status === "FAILED") {
        void fetchReport();
      }
    };
    socket.on("report:progress", onProgress);
    return () => {
      socket.emit("unsubscribe", reportId);
      socket.off("report:progress", onProgress);
    };
  }, [reportId, fetchReport]);

  const downloadUrl = (kind: "docx" | "pdf"): string => {
    const token = getToken();
    return `${apiBaseUrl}/api/reports/${reportId}/download/${kind}${token ? `?_=${Date.now()}` : ""}`;
  };

  const downloadFile = async (kind: "docx" | "pdf"): Promise<void> => {
    const res = await api.get(`/reports/${reportId}/download/${kind}`, { responseType: "blob" });
    const url = URL.createObjectURL(res.data as Blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${reportId}.${kind}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  if (!report) return <div className="text-muted-foreground">Загрузка…</div>;

  const isDone = report.status === "COMPLETED";
  const isFail = report.status === "FAILED";

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <FileText className="h-6 w-6 text-muted-foreground" />
        <div>
          <h1 className="text-2xl font-semibold">{report.topic}</h1>
          <div className="text-sm text-muted-foreground">
            {report.discipline} · {report.pages} стр · {report.language}
          </div>
        </div>
        <Badge className="ml-auto" variant={isDone ? "success" : isFail ? "destructive" : "secondary"}>
          {report.status}
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <motion.span
              animate={{ rotate: isDone || isFail ? 0 : 360 }}
              transition={{ repeat: isDone || isFail ? 0 : Infinity, duration: 4, ease: "linear" }}
              className="grid h-8 w-8 place-items-center rounded-md refmaster-gradient text-white"
            >
              <Sparkles className="h-4 w-4" />
            </motion.span>
            Прогресс генерации
          </CardTitle>
          <CardDescription>{progressMsg || (isDone ? "Готово" : isFail ? "Ошибка" : "Идёт генерация…")}</CardDescription>
        </CardHeader>
        <CardContent>
          <Progress value={Math.max(progressVal, report.progress)} />
          <div className="mt-2 text-xs text-muted-foreground">{Math.max(progressVal, report.progress)}%</div>
          {isFail && report.errorMessage && (
            <div className="mt-3 text-sm text-destructive">{report.errorMessage}</div>
          )}
        </CardContent>
      </Card>

      {isDone && (
        <Card>
          <CardHeader>
            <CardTitle>Скачать</CardTitle>
            <CardDescription>Документ готов в обоих форматах.</CardDescription>
          </CardHeader>
          <CardContent className="flex gap-3">
            <Button onClick={() => void downloadFile("docx")}><Download className="mr-2 h-4 w-4" /> DOCX</Button>
            {report.pdfPath && (
              <Button variant="outline" onClick={() => void downloadFile("pdf")}><Download className="mr-2 h-4 w-4" /> PDF</Button>
            )}
            <a href={downloadUrl("docx")} target="_blank" rel="noreferrer" className="hidden" />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Параметры</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-y-2 text-sm">
          <div className="text-muted-foreground">Тема</div><div>{report.topic}</div>
          <div className="text-muted-foreground">Дисциплина</div><div>{report.discipline}</div>
          <div className="text-muted-foreground">Объём</div><div>{report.pages} стр.</div>
          <div className="text-muted-foreground">Язык</div><div>{report.language}</div>
          <div className="text-muted-foreground">Уровень</div><div>{report.difficulty}</div>
          <div className="text-muted-foreground">Шаблон</div><div>{report.template?.name ?? "—"}</div>
          {report.requirements && (<>
            <div className="text-muted-foreground">Требования</div><div className="whitespace-pre-line">{report.requirements}</div>
          </>)}
        </CardContent>
      </Card>
    </div>
  );
}
