"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { StatsCard } from "@/components/dashboard/stats-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import { Bus, ScanLine, History } from "lucide-react";
import Link from "next/link";

export default function DriverDashboard() {
  const activeTrip = useQuery(api.trips.getActiveTrip);
  const history = useQuery(api.trips.getDriverHistory, { limit: 5 });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Driver Dashboard</h1>

      {activeTrip ? (
        <Card className="border-primary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bus className="h-5 w-5" />
              Active Trip: {activeTrip.route?.name}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Started</p>
                <p className="font-medium">
                  {new Date(activeTrip.trip.startedAt).toLocaleTimeString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Passengers Scanned</p>
                <p className="font-medium text-2xl">{activeTrip.scans.length}</p>
              </div>
            </div>
            <Link href="/driver/scan">
              <Button className="w-full">
                <ScanLine className="h-4 w-4 mr-2" />
                Continue Scanning
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground mb-4">No active trip</p>
            <Link href="/driver/routes">
              <Button>
                <Bus className="h-4 w-4 mr-2" />
                Start a Trip
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <StatsCard
          title="Total Trips"
          value={history?.length || 0}
          icon={History}
        />
        <StatsCard
          title="Passengers Today"
          value={
            history
              ?.filter((h) => {
                const today = new Date();
                const tripDate = new Date(h.trip.startedAt);
                return tripDate.toDateString() === today.toDateString();
              })
              .reduce((sum, h) => sum + h.scanCount, 0) || 0
          }
          icon={ScanLine}
        />
      </div>

      {history && history.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Trips</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {history.slice(0, 5).map((item) => (
                <div
                  key={item.trip._id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted"
                >
                  <div>
                    <p className="font-medium">{item.route?.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(item.trip.startedAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{item.scanCount}</p>
                    <p className="text-sm text-muted-foreground">passengers</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
