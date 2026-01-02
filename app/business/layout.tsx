import { DashboardLayout } from "@/components/dashboard/dashboard-layout";

export default function BusinessLayout({ children }: { children: React.ReactNode }) {
  return <DashboardLayout expectedRole="business">{children}</DashboardLayout>;
}
