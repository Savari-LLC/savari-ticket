"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { StatsCard } from "@/components/dashboard/stats-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Route, Users, UserCheck, Bus, ScanLine } from "lucide-react";

export default function OperatorDashboard() {
  const membership = useQuery(api.operators.getMyMembership);
  const stats = useQuery(
    api.reports.getDashboardStats,
    membership?.operator?._id ? { operatorId: membership.operator._id } : "skip"
  );

  if (!stats) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Active Routes"
          value={stats.activeRouteCount}
          description={`${stats.routeCount} total routes`}
          icon={Route}
        />
        <StatsCard
          title="Drivers"
          value={stats.driverCount}
          icon={Users}
        />
        <StatsCard
          title="Businesses"
          value={stats.businessCount}
          icon={Users}
        />
        <StatsCard
          title="Passengers"
          value={stats.passengerCount}
          icon={UserCheck}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <StatsCard
          title="Active Trips"
          value={stats.activeTripCount}
          description={`${stats.tripCount} total trips`}
          icon={Bus}
        />
        <StatsCard
          title="Total Scans"
          value={stats.totalScans}
          description="All time passenger scans"
          icon={ScanLine}
        />
      </div>
    </div>
  );
}
