import { DashboardLayout } from "@/components/dashboard/dashboard-layout";

export default function OperatorLayout({ children }: { children: React.ReactNode }) {
  return <DashboardLayout expectedRole="operator">{children}</DashboardLayout>;
}
