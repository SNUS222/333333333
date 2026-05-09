"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BookOpenCheck,
  Brain,
  FileText,
  Languages,
  PaintRoller,
  ShieldCheck,
  Sparkles,
  Wand2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SiteHeader } from "@/components/layout/site-header";

const FEATURES = [
  { icon: Brain, title: "Multi-step AI pipeline", desc: "Анализ темы → план → поиск источников → написание → форматирование → экспорт. Каждый шаг — отдельный AI-проход." },
  { icon: PaintRoller, title: "Template Analyzer", desc: "Загрузите DOCX/PDF — AI извлечёт шрифты, отступы, заголовки и применит ваш стиль к новому реферату." },
  { icon: BookOpenCheck, title: "Реальные источники", desc: "Crossref + Semantic Scholar: автоматический поиск литературы и оформление списка с DOI." },
  { icon: Languages, title: "Любой язык", desc: "Русский, английский и десятки других. Академический стиль, плавные переходы." },
  { icon: FileText, title: "Готовый DOCX", desc: "Титульный лист, оглавление, нумерация, колонтитулы, библиография — всё по ГОСТ или вашему примеру." },
  { icon: ShieldCheck, title: "Безопасность", desc: "JWT + Google OAuth, rate-limit, encrypted secrets, hCaptcha. Production-ready." },
];

const PIPELINE = [
  { n: 1, title: "Анализ темы", desc: "AI уточняет формулировку, выделяет ключевые понятия и формирует поисковые запросы." },
  { n: 2, title: "Анализ шаблона", desc: "TemplateAnalyzerService извлекает JSON-схему оформления из вашего DOCX/PDF." },
  { n: 3, title: "Структура", desc: "Генерируется содержание с распределением слов по главам и подразделам." },
  { n: 4, title: "Поиск источников", desc: "Crossref + Semantic Scholar дают релевантные публикации по теме." },
  { n: 5, title: "Текст", desc: "Главы пишутся по очереди, с цитатами [1], [2] и плавными переходами." },
  { n: 6, title: "Форматирование", desc: "Применяются шрифты, интервалы, заголовки, отступы из проанализированного шаблона." },
  { n: 7, title: "Экспорт", desc: "Финальный DOCX + конвертация в PDF через LibreOffice." },
];

export default function LandingPage(): React.ReactElement {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <section className="container py-20 md:py-28">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-3xl text-center"
        >
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border bg-background/60 px-3 py-1 text-xs text-muted-foreground">
            <Sparkles className="h-3 w-3" /> Multi-step AI · Template Analyzer · DOCX engine
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
            Реферат «под ключ» —{" "}
            <span className="refmaster-gradient-text">за 5 минут</span>
          </h1>
          <p className="mt-6 text-lg text-muted-foreground">
            Загрузите пример оформления, опишите тему и предмет — RefMaster AI напишет, оформит и пришлёт готовый
            DOCX с титульным листом, содержанием, библиографией и нумерацией.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg">
              <Link href="/register">
                Начать бесплатно <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="#pipeline">Как это работает</Link>
            </Button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="mt-16 mx-auto max-w-5xl rounded-2xl border bg-card p-1 shadow-2xl shadow-primary/10"
        >
          <div className="rounded-xl refmaster-gradient p-8 md:p-12 text-white">
            <div className="grid gap-6 md:grid-cols-3">
              <div className="rounded-xl bg-black/20 backdrop-blur p-5">
                <div className="text-sm uppercase tracking-wide opacity-70">Тема</div>
                <div className="mt-1 text-lg font-semibold">Влияние ИИ на рынок труда</div>
              </div>
              <div className="rounded-xl bg-black/20 backdrop-blur p-5">
                <div className="text-sm uppercase tracking-wide opacity-70">Объём</div>
                <div className="mt-1 text-lg font-semibold">25 страниц · RU</div>
              </div>
              <div className="rounded-xl bg-black/20 backdrop-blur p-5">
                <div className="text-sm uppercase tracking-wide opacity-70">Шаблон</div>
                <div className="mt-1 text-lg font-semibold">ГОСТ_2024.docx</div>
              </div>
            </div>
            <div className="mt-6 flex items-center gap-3 text-sm">
              <Wand2 className="h-4 w-4" />
              <span>Pipeline: анализ → план → источники → текст → формат → DOCX</span>
            </div>
          </div>
        </motion.div>
      </section>

      <section id="features" className="container py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl md:text-4xl font-bold">Возможности</h2>
          <p className="mt-3 text-muted-foreground">Всё, что нужно для научного письма с AI — в одном продукте.</p>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {FEATURES.map((f, i) => {
            const Icon = f.icon;
            return (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
              >
                <Card className="h-full">
                  <CardHeader>
                    <div className="grid h-10 w-10 place-items-center rounded-md refmaster-gradient text-white">
                      <Icon className="h-5 w-5" />
                    </div>
                    <CardTitle className="mt-4 text-lg">{f.title}</CardTitle>
                    <CardDescription>{f.desc}</CardDescription>
                  </CardHeader>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </section>

      <section id="pipeline" className="container py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl md:text-4xl font-bold">AI Pipeline</h2>
          <p className="mt-3 text-muted-foreground">Семь этапов, между которыми передаётся контекст.</p>
        </div>
        <div className="mt-12 grid gap-4 md:grid-cols-3 lg:grid-cols-4">
          {PIPELINE.map((p, i) => (
            <motion.div
              key={p.n}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
              className="rounded-xl border bg-card p-5"
            >
              <div className="text-xs font-mono text-muted-foreground">шаг {p.n}</div>
              <div className="mt-2 text-lg font-semibold">{p.title}</div>
              <div className="mt-2 text-sm text-muted-foreground">{p.desc}</div>
            </motion.div>
          ))}
        </div>
      </section>

      <section id="pricing" className="container py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl md:text-4xl font-bold">Тарифы</h2>
          <p className="mt-3 text-muted-foreground">Начните бесплатно. Апгрейд — когда нужно больше страниц.</p>
        </div>
        <div className="mt-10 grid gap-6 md:grid-cols-2 max-w-3xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Free</CardTitle>
              <CardDescription>До 3 рефератов в месяц, 10 страниц</CardDescription>
              <div className="mt-4 text-4xl font-bold">$0</div>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <div>· AI pipeline (полный)</div>
              <div>· Crossref + Semantic Scholar</div>
              <div>· Экспорт в DOCX и PDF</div>
            </CardContent>
          </Card>
          <Card className="border-primary/40">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">Premium <span className="text-xs rounded-full refmaster-gradient text-white px-2 py-0.5">popular</span></CardTitle>
              <CardDescription>До 200 рефератов в месяц, 60 страниц</CardDescription>
              <div className="mt-4 text-4xl font-bold">$19<span className="text-base text-muted-foreground">/мес</span></div>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <div>· Пользовательские шаблоны</div>
              <div>· Приоритетная очередь</div>
              <div>· Поддержка email</div>
            </CardContent>
          </Card>
        </div>
      </section>

      <footer className="border-t py-10">
        <div className="container flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div>© {new Date().getFullYear()} RefMaster AI</div>
          <div className="flex gap-4">
            <Link href="/login">Войти</Link>
            <Link href="/register">Регистрация</Link>
            <Link href="/dashboard">Кабинет</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
