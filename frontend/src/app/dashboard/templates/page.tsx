"use client";
import * as React from "react";
import { File, Trash2, Upload } from "lucide-react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Template } from "@/lib/types";

export default function TemplatesPage(): React.ReactElement {
  const [templates, setTemplates] = React.useState<Template[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [uploading, setUploading] = React.useState(false);
  const [drag, setDrag] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const refresh = async (): Promise<void> => {
    const { data } = await api.get<{ templates: Template[] }>("/templates");
    setTemplates(data.templates);
  };

  React.useEffect(() => {
    void refresh().finally(() => setLoading(false));
  }, []);

  const upload = async (file: File): Promise<void> => {
    setError(null);
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("name", file.name);
      fd.append("useAi", "true");
      await api.post("/templates", fd, { headers: { "Content-Type": "multipart/form-data" } });
      await refresh();
    } catch (err) {
      const e = err as { response?: { data?: { error?: string } } };
      setError(e.response?.data?.error ?? "Не удалось загрузить файл");
    } finally {
      setUploading(false);
    }
  };

  const onDrop = (e: React.DragEvent<HTMLDivElement>): void => {
    e.preventDefault();
    setDrag(false);
    const f = e.dataTransfer.files[0];
    if (f) void upload(f);
  };

  const onPick = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const f = e.target.files?.[0];
    if (f) void upload(f);
    e.target.value = "";
  };

  const remove = async (id: string): Promise<void> => {
    if (!confirm("Удалить шаблон?")) return;
    await api.delete(`/templates/${id}`);
    await refresh();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Шаблоны оформления</h1>
        <p className="text-muted-foreground mt-1">Загружайте DOCX/PDF — AI извлечёт стиль и применит к новому реферату.</p>
      </div>

      <Card
        className={`border-dashed ${drag ? "border-primary bg-accent/40" : ""}`}
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={onDrop}
      >
        <CardContent className="py-10 text-center">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-full refmaster-gradient text-white mb-3">
            <Upload className="h-5 w-5" />
          </div>
          <div className="text-lg font-semibold">Перетащите файл сюда или выберите</div>
          <div className="text-sm text-muted-foreground mt-1">DOCX или PDF, до 25 MB</div>
          <div className="mt-4">
            <input id="file" type="file" className="hidden" accept=".docx,.pdf,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={onPick} />
            <Button asChild disabled={uploading}>
              <label htmlFor="file" className="cursor-pointer">{uploading ? "Анализируем…" : "Выбрать файл"}</label>
            </Button>
          </div>
          {error && <div className="text-sm text-destructive mt-3">{error}</div>}
        </CardContent>
      </Card>

      <div className="grid gap-3">
        {loading && <div className="text-sm text-muted-foreground">Загрузка…</div>}
        {!loading && templates.length === 0 && (
          <div className="text-sm text-muted-foreground">Пока нет загруженных шаблонов.</div>
        )}
        {templates.map((t) => {
          const style = t.styleJson as { font?: string; fontSize?: number; lineSpacing?: number };
          return (
            <Card key={t.id}>
              <CardHeader className="flex-row items-center justify-between gap-4 space-y-0">
                <div className="flex items-center gap-3 min-w-0">
                  <File className="h-5 w-5 text-muted-foreground shrink-0" />
                  <div className="min-w-0">
                    <CardTitle className="text-base truncate">{t.name}</CardTitle>
                    <CardDescription className="truncate">
                      {t.originalFilename} · {(t.size / 1024).toFixed(0)} KB
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">
                    {style.font ?? "?"} · {style.fontSize ?? "?"}pt · {style.lineSpacing ?? "?"}x
                  </Badge>
                  <Button size="icon" variant="ghost" onClick={() => void remove(t.id)} aria-label="Удалить">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
