"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api } from "@/lib/api";
import type { Report, Template } from "@/lib/types";

export default function CreateReportPage(): React.ReactElement {
  const router = useRouter();
  const [topic, setTopic] = React.useState("");
  const [discipline, setDiscipline] = React.useState("");
  const [language, setLanguage] = React.useState("ru");
  const [pages, setPages] = React.useState(15);
  const [difficulty, setDifficulty] = React.useState<"intro" | "standard" | "advanced">("standard");
  const [requirements, setRequirements] = React.useState("");
  const [templateId, setTemplateId] = React.useState<string>("");
  const [templates, setTemplates] = React.useState<Template[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    api.get<{ templates: Template[] }>("/templates").then(({ data }) => setTemplates(data.templates)).catch(() => undefined);
  }, []);

  const onSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { data } = await api.post<{ report: Report }>("/reports", {
        topic,
        discipline,
        language,
        pages,
        difficulty,
        requirements: requirements || undefined,
        templateId: templateId || undefined,
      });
      router.push(`/dashboard/reports/${data.report.id}`);
    } catch (err) {
      const e = err as { response?: { data?: { error?: string } }; message?: string };
      setError(e.response?.data?.error ?? e.message ?? "Не удалось создать реферат");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl">
      <h1 className="text-3xl font-bold">Новый реферат</h1>
      <p className="text-muted-foreground mt-1">Заполните параметры — AI сгенерирует структуру, текст и DOCX.</p>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Параметры</CardTitle>
          <CardDescription>Чем точнее тема и требования, тем лучше результат.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-5" onSubmit={onSubmit}>
            <div className="space-y-2">
              <Label htmlFor="topic">Тема</Label>
              <Input id="topic" required value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="Например: Влияние ИИ на рынок труда" />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="discipline">Дисциплина / предмет</Label>
                <Input id="discipline" required value={discipline} onChange={(e) => setDiscipline(e.target.value)} placeholder="Например: Экономика" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="language">Язык</Label>
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ru">Русский</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="es">Español</SelectItem>
                    <SelectItem value="de">Deutsch</SelectItem>
                    <SelectItem value="fr">Français</SelectItem>
                    <SelectItem value="uk">Українська</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="pages">Объём (страниц)</Label>
                <Input id="pages" type="number" min={1} max={120} value={pages} onChange={(e) => setPages(Number(e.target.value))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="difficulty">Уровень</Label>
                <Select value={difficulty} onValueChange={(v) => setDifficulty(v as typeof difficulty)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="intro">Школьный / вводный</SelectItem>
                    <SelectItem value="standard">Студенческий</SelectItem>
                    <SelectItem value="advanced">Продвинутый / магистратура</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="template">Шаблон оформления (опционально)</Label>
              <Select value={templateId || "none"} onValueChange={(v) => setTemplateId(v === "none" ? "" : v)}>
                <SelectTrigger><SelectValue placeholder="Без шаблона" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Без шаблона (стандартное оформление)</SelectItem>
                  {templates.map((t) => (
                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="requirements">Дополнительные требования</Label>
              <Textarea
                id="requirements"
                rows={4}
                value={requirements}
                onChange={(e) => setRequirements(e.target.value)}
                placeholder="ГОСТ, обязательные разделы, тон, целевая аудитория, специфика…"
              />
            </div>
            {error && <div className="text-sm text-destructive">{error}</div>}
            <div className="flex justify-end gap-3">
              <Button type="submit" disabled={loading}>
                {loading ? "Создаём…" : "Сгенерировать"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
