import { DashboardLayout } from "@/components/dashboard/dashboard-layout";

export default function DriverLayout({ children }: { children: React.ReactNode }) {
  return <DashboardLayout expectedRole="driver">{children}</DashboardLayout>;
}
