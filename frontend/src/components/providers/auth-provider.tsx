"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { api, setToken } from "@/lib/api";
import type { User } from "@/lib/types";

interface AuthCtx {
  user: User | null;
  loading: boolean;
  refresh: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name?: string) => Promise<void>;
  loginWithGoogle: (idToken: string) => Promise<void>;
  logout: () => void;
}

const Ctx = React.createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }): React.ReactElement {
  const [user, setUser] = React.useState<User | null>(null);
  const [loading, setLoading] = React.useState<boolean>(true);
  const router = useRouter();

  const refresh = React.useCallback(async () => {
    try {
      const { data } = await api.get<{ user: User }>("/auth/me");
      setUser(data.user);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void refresh();
  }, [refresh]);

  const login = async (email: string, password: string): Promise<void> => {
    const { data } = await api.post<{ token: string; user: User }>("/auth/login", { email, password });
    setToken(data.token);
    setUser(data.user);
    router.push("/dashboard");
  };

  const register = async (email: string, password: string, name?: string): Promise<void> => {
    const { data } = await api.post<{ token: string; user: User }>("/auth/register", { email, password, name });
    setToken(data.token);
    setUser(data.user);
    router.push("/dashboard");
  };

  const loginWithGoogle = async (idToken: string): Promise<void> => {
    const { data } = await api.post<{ token: string; user: User }>("/auth/google", { idToken });
    setToken(data.token);
    setUser(data.user);
    router.push("/dashboard");
  };

  const logout = (): void => {
    setToken(null);
    setUser(null);
    router.push("/");
  };

  return (
    <Ctx.Provider value={{ user, loading, refresh, login, register, loginWithGoogle, logout }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth(): AuthCtx {
  const ctx = React.useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
