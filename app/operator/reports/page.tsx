"use client";

import { useState, useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { DateNavigator } from "@/components/ui/date-picker";
import { Users } from "lucide-react";

export default function ReportsPage() {
  const membership = useQuery(api.operators.getMyMembership);
  
  // Date state - default to today
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  // Passenger popup state
  const [selectedRoute, setSelectedRoute] = useState<{
    id: Id<"routes">;
    name: string;
  } | null>(null);

  // Calculate date range (start and end of selected day)
  const dateRange = useMemo(() => {
    const start = new Date(selectedDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(selectedDate);
    end.setHours(23, 59, 59, 999);
    return { dateStart: start.getTime(), dateEnd: end.getTime() };
  }, [selectedDate]);

  const routeStats = useQuery(
    api.reports.getRouteStats,
    membership?.operator?._id 
      ? { operatorId: membership.operator._id, ...dateRange } 
      : "skip"
  );
  
  const recentTrips = useQuery(
    api.reports.getRecentTrips,
    membership?.operator?._id 
      ? { operatorId: membership.operator._id, limit: 20, ...dateRange } 
      : "skip"
  );
  
  const passengerStats = useQuery(
    api.reports.getPassengerStats,
    membership?.operator?._id ? { operatorId: membership.operator._id } : "skip"
  );

  // Query for route passengers when popup is open
  const routePassengers = useQuery(
    api.reports.getRoutePassengers,
    selectedRoute 
      ? { routeId: selectedRoute.id, ...dateRange }
      : "skip"
  );

  if (!routeStats || !recentTrips || !passengerStats) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Reports</h1>
        <Skeleton className="h-96" />
      </div>
    );
  }

  const totalTripsToday = routeStats.reduce((sum, s) => sum + s.tripCount, 0);
  const totalPassengersToday = routeStats.reduce((sum, s) => sum + s.totalPassengers, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-2xl font-bold">Reports</h1>
        <DateNavigator date={selectedDate} onDateChange={setSelectedDate} />
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Trips Today</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTripsToday}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Passengers Scanned</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPassengersToday}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="routes">
        <TabsList>
          <TabsTrigger value="routes">Routes</TabsTrigger>
          <TabsTrigger value="trips">Trips</TabsTrigger>
          <TabsTrigger value="passengers">All Passengers</TabsTrigger>
        </TabsList>

        <TabsContent value="routes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Route Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              {routeStats.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No trips on this date
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Route</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Trips</TableHead>
                      <TableHead className="text-right">Passengers</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {routeStats.map((stat) => (
                      <TableRow key={stat.route._id}>
                        <TableCell className="font-medium">{stat.route.name}</TableCell>
                        <TableCell>
                          <Badge variant={stat.route.isActive ? "default" : "secondary"}>
                            {stat.route.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">{stat.tripCount}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="font-bold"
                            onClick={() => setSelectedRoute({ 
                              id: stat.route._id, 
                              name: stat.route.name 
                            })}
                            disabled={stat.totalPassengers === 0}
                          >
                            {stat.totalPassengers}
                            {stat.totalPassengers > 0 && (
                              <Users className="ml-1 h-3 w-3" />
                            )}
                          </Button>
                        </TableCell>
                        <TableCell>
                          {stat.activeTrips > 0 && (
                            <Badge variant="outline" className="text-green-600">
                              {stat.activeTrips} active
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trips" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Trips</CardTitle>
            </CardHeader>
            <CardContent>
              {recentTrips.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No trips on this date
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Route</TableHead>
                      <TableHead>Driver</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead className="text-right">Passengers</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentTrips.map((item) => (
                      <TableRow key={item.trip._id}>
                        <TableCell className="font-medium">{item.route?.name}</TableCell>
                        <TableCell>{item.driver?.name || "Unknown"}</TableCell>
                        <TableCell>
                          <Badge variant={item.trip.status === "active" ? "default" : "secondary"}>
                            {item.trip.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(item.trip.startedAt).toLocaleTimeString()}
                        </TableCell>
                        <TableCell className="text-right">{item.scanCount}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="passengers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>All Passengers (All Time)</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Passenger</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Added By</TableHead>
                    <TableHead className="text-right">Total Trips</TableHead>
                    <TableHead>Last Scan</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {passengerStats.map((stat) => (
                    <TableRow key={stat.passenger._id}>
                      <TableCell className="font-medium">{stat.passenger.name}</TableCell>
                      <TableCell>{stat.passenger.email}</TableCell>
                      <TableCell>{stat.business?.name || "Unknown"}</TableCell>
                      <TableCell className="text-right">{stat.tripCount}</TableCell>
                      <TableCell>
                        {stat.lastScan
                          ? new Date(stat.lastScan).toLocaleString()
                          : "Never"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Passenger List Popup */}
      <Dialog open={!!selectedRoute} onOpenChange={(open) => !open && setSelectedRoute(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              Passengers - {selectedRoute?.name}
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground mb-4">
            {new Date(selectedDate).toLocaleDateString("en-US", { 
              weekday: "long", 
              year: "numeric", 
              month: "long", 
              day: "numeric" 
            })}
          </p>
          {routePassengers === undefined ? (
            <Skeleton className="h-32" />
          ) : routePassengers.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No passengers scanned on this route today
            </p>
          ) : (
            <div className="max-h-96 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead className="text-right">Scans</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {routePassengers.map((p) => (
                    <TableRow key={p.passenger._id}>
                      <TableCell className="font-medium">{p.passenger.name}</TableCell>
                      <TableCell>{p.passenger.email}</TableCell>
                      <TableCell className="text-right">{p.scanCount}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
