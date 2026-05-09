"use client";
import * as React from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/components/providers/auth-provider";

interface Plan {
  id: "FREE" | "PREMIUM";
  name: string;
  priceMonthlyUsd: number;
  features: string[];
}
interface PlansResponse { plans: Plan[]; stripeEnabled: boolean }

export default function SettingsPage(): React.ReactElement {
  const { user, refresh } = useAuth();
  const [plans, setPlans] = React.useState<Plan[]>([]);
  const [stripeEnabled, setStripeEnabled] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => {
    api.get<PlansResponse>("/billing/plans").then(({ data }) => {
      setPlans(data.plans);
      setStripeEnabled(data.stripeEnabled);
    }).finally(() => setLoading(false));
  }, []);

  const upgrade = async (): Promise<void> => {
    setBusy(true);
    try {
      const { data } = await api.post<{ url: string }>("/billing/checkout");
      window.location.href = data.url;
    } finally {
      setBusy(false);
    }
  };

  const portal = async (): Promise<void> => {
    setBusy(true);
    try {
      const { data } = await api.post<{ url: string }>("/billing/portal");
      window.location.href = data.url;
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-3xl font-bold">Настройки</h1>
        <p className="text-muted-foreground mt-1">Профиль и подписка.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Профиль</CardTitle>
          <CardDescription>Базовая информация об аккаунте.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-y-2 text-sm">
          <div className="text-muted-foreground">Email</div><div>{user?.email}</div>
          <div className="text-muted-foreground">Имя</div><div>{user?.name ?? "—"}</div>
          <div className="text-muted-foreground">Роль</div><div>{user?.role}</div>
          <div className="text-muted-foreground">Тариф</div><div><Badge>{user?.plan}</Badge></div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Подписка</CardTitle>
          <CardDescription>Управление тарифом и оплатой через Stripe.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading && <div className="text-sm text-muted-foreground">Загрузка…</div>}
          {!loading && (
            <div className="grid gap-4 md:grid-cols-2">
              {plans.map((p) => (
                <Card key={p.id} className={p.id === user?.plan ? "border-primary/40" : ""}>
                  <CardHeader>
                    <CardTitle>{p.name}</CardTitle>
                    <div className="text-2xl font-bold">${p.priceMonthlyUsd}/мес</div>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground space-y-1">
                    {p.features.map((f) => <div key={f}>· {f}</div>)}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
          {stripeEnabled ? (
            user?.plan === "PREMIUM" ? (
              <Button variant="outline" onClick={portal} disabled={busy}>Открыть портал биллинга</Button>
            ) : (
              <Button onClick={upgrade} disabled={busy}>Перейти на Premium</Button>
            )
          ) : (
            <div className="text-sm text-muted-foreground">Stripe не настроен в этом окружении.</div>
          )}
          <Button variant="ghost" size="sm" onClick={() => void refresh()}>Обновить статус</Button>
        </CardContent>
      </Card>
    </div>
  );
}
