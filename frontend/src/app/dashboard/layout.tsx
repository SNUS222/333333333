import { DashboardShell } from "@/components/layout/dashboard-shell";

export default function DashboardLayout({ children }: { children: React.ReactNode }): React.ReactElement {
  return <DashboardShell>{children}</DashboardShell>;
}
