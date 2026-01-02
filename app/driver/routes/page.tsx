"use client";

import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Play } from "lucide-react";
import { toast } from "sonner";

export default function DriverRoutesPage() {
  const router = useRouter();
  const membership = useQuery(api.operators.getMyMembership);
  const routes = useQuery(
    api.routes.listActive,
    membership?.operator?._id ? { operatorId: membership.operator._id } : "skip"
  );
  const activeTrip = useQuery(api.trips.getActiveTrip);
  const startTrip = useMutation(api.trips.startTrip);

  const handleStartTrip = async (routeId: NonNullable<typeof routes>[number]["_id"]) => {
    try {
      await startTrip({ routeId });
      toast.success("Trip started!");
      router.push("/driver/scan");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to start trip");
    }
  };

  if (!routes) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Select Route</h1>
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Select Route</h1>

      {activeTrip && (
        <Card className="border-primary">
          <CardContent className="py-4">
            <p className="text-sm text-muted-foreground">
              You have an active trip on <strong>{activeTrip.route?.name}</strong>.
              End it before starting a new one.
            </p>
            <Button
              className="mt-2"
              variant="outline"
              onClick={() => router.push("/driver/scan")}
            >
              Go to Active Trip
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {routes.map((route) => (
          <Card key={route._id}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                {route.name}
                <Badge>Active</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {route.description && (
                <p className="text-sm text-muted-foreground mb-4">
                  {route.description}
                </p>
              )}
              <Button
                className="w-full"
                onClick={() => handleStartTrip(route._id)}
                disabled={!!activeTrip}
              >
                <Play className="h-4 w-4 mr-2" />
                Start Trip
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {routes.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No active routes available</p>
        </div>
      )}
    </div>
  );
}
