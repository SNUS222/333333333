"use client";
import * as React from "react";
import { api } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/providers/auth-provider";

interface Stats {
  users: number;
  premium: number;
  reports: number;
  completed: number;
  failed: number;
  recentReports: number;
}
interface AdminUser {
  id: string;
  email: string;
  name: string | null;
  role: "USER" | "ADMIN";
  plan: "FREE" | "PREMIUM";
  createdAt: string;
  subscriptionStatus: string | null;
  _count: { reports: number; templates: number };
}

export default function AdminPage(): React.ReactElement {
  const { user, loading } = useAuth();
  const [stats, setStats] = React.useState<Stats | null>(null);
  const [users, setUsers] = React.useState<AdminUser[]>([]);
  const [loaded, setLoaded] = React.useState(false);

  React.useEffect(() => {
    if (loading || user?.role !== "ADMIN") return;
    Promise.all([
      api.get<Stats>("/admin/stats"),
      api.get<{ items: AdminUser[] }>("/admin/users"),
    ]).then(([s, u]) => {
      setStats(s.data);
      setUsers(u.data.items);
    }).finally(() => setLoaded(true));
  }, [loading, user]);

  if (loading) return <div>Загрузка…</div>;
  if (user?.role !== "ADMIN") {
    return <div className="text-muted-foreground">Доступ только для администраторов.</div>;
  }

  const togglePlan = async (id: string, plan: "FREE" | "PREMIUM"): Promise<void> => {
    await api.patch(`/admin/users/${id}`, { plan });
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, plan } : u)));
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Админ-панель</h1>

      {stats && (
        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
          {[
            { l: "Пользователи", v: stats.users },
            { l: "Premium", v: stats.premium },
            { l: "Все рефераты", v: stats.reports },
            { l: "Готовых", v: stats.completed },
            { l: "Ошибок", v: stats.failed },
            { l: "За 7 дней", v: stats.recentReports },
          ].map((c) => (
            <Card key={c.l}>
              <CardHeader>
                <CardDescription>{c.l}</CardDescription>
                <CardTitle className="text-3xl">{c.v}</CardTitle>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Пользователи</CardTitle>
          <CardDescription>{users.length} последних</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {!loaded && <div className="text-sm text-muted-foreground">Загрузка…</div>}
          {loaded && (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-muted-foreground">
                  <th className="py-2 pr-4">Email</th>
                  <th className="py-2 pr-4">Имя</th>
                  <th className="py-2 pr-4">Роль</th>
                  <th className="py-2 pr-4">Тариф</th>
                  <th className="py-2 pr-4">Рефератов</th>
                  <th className="py-2 pr-4">Создан</th>
                  <th className="py-2 pr-4 text-right">Действия</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-t">
                    <td className="py-2 pr-4">{u.email}</td>
                    <td className="py-2 pr-4">{u.name ?? "—"}</td>
                    <td className="py-2 pr-4"><Badge variant={u.role === "ADMIN" ? "default" : "secondary"}>{u.role}</Badge></td>
                    <td className="py-2 pr-4"><Badge variant={u.plan === "PREMIUM" ? "default" : "secondary"}>{u.plan}</Badge></td>
                    <td className="py-2 pr-4">{u._count.reports}</td>
                    <td className="py-2 pr-4">{new Date(u.createdAt).toLocaleDateString()}</td>
                    <td className="py-2 pr-4 text-right">
                      <Button size="sm" variant="outline" onClick={() => void togglePlan(u.id, u.plan === "PREMIUM" ? "FREE" : "PREMIUM")}>
                        {u.plan === "PREMIUM" ? "→ FREE" : "→ PREMIUM"}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
