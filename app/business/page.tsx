"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { StatsCard } from "@/components/dashboard/stats-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, QrCode } from "lucide-react";
import Link from "next/link";

export default function BusinessDashboard() {
  const membership = useQuery(api.operators.getMyMembership);
  const passengersResult = useQuery(
    api.passengers.list,
    membership?.operator?._id
      ? {
          operatorId: membership.operator._id,
          paginationOpts: { cursor: null, numItems: 5 },
        }
      : "skip"
  );

  const passengers = passengersResult?.page ?? [];

  if (!passengersResult) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      <div className="grid gap-4 md:grid-cols-2">
        <StatsCard
          title="Total Passengers"
          value={passengers.length}
          description="Passengers you've added"
          icon={Users}
        />
        <StatsCard
          title="QR Codes Generated"
          value={passengers.length}
          description="Ready for scanning"
          icon={QrCode}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-4">
          <Link href="/business/passengers">
            <Button>
              <Users className="h-4 w-4 mr-2" />
              Manage Passengers
            </Button>
          </Link>
        </CardContent>
      </Card>

      {passengers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Passengers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {passengers.map((passenger) => (
                <div
                  key={passenger._id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted"
                >
                  <div>
                    <p className="font-medium">{passenger.name}</p>
                    <p className="text-sm text-muted-foreground">{passenger.email}</p>
                  </div>
                  <Link href={`/business/qr/${passenger._id}`}>
                    <Button variant="outline" size="sm">
                      <QrCode className="h-4 w-4 mr-2" />
                      View QR
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
