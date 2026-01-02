"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { QRScanner } from "@/components/qr/qr-scanner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { StopCircle, CheckCircle, AlertCircle, Users } from "lucide-react";
import { toast } from "sonner";

export default function ScanPage() {
  const router = useRouter();
  const activeTrip = useQuery(api.trips.getActiveTrip);
  const scanPassenger = useMutation(api.trips.scanPassenger);
  const endTrip = useMutation(api.trips.endTrip);

  const [lastScanResult, setLastScanResult] = useState<{
    status: "success" | "already_scanned" | "error";
    message: string;
    passengerName?: string;
  } | null>(null);
  
  // Track last scanned QR to prevent duplicate processing
  const lastScannedRef = useRef<string | null>(null);
  const scanTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Must define all hooks before any early returns
  const handleScan = useCallback(async (qrCode: string) => {
    // Ignore if same QR code was just scanned (debounce)
    if (lastScannedRef.current === qrCode) {
      return;
    }
    
    // Set this as the last scanned code
    lastScannedRef.current = qrCode;
    
    // Clear the last scanned after 3 seconds to allow re-scanning
    if (scanTimeoutRef.current) {
      clearTimeout(scanTimeoutRef.current);
    }
    scanTimeoutRef.current = setTimeout(() => {
      lastScannedRef.current = null;
    }, 3000);

    if (!activeTrip) return;

    try {
      const result = await scanPassenger({
        tripSessionId: activeTrip.trip._id,
        qrCode,
      });
      
      if (result.status === "already_scanned") {
        setLastScanResult({
          status: "already_scanned",
          message: "Already scanned on this trip",
          passengerName: result.passenger.name,
        });
        // Don't spam toasts for already scanned
      } else {
        setLastScanResult({
          status: "success",
          message: "Passenger scanned successfully!",
          passengerName: result.passenger.name,
        });
        toast.success(`Scanned: ${result.passenger.name}`);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Scan failed";
      setLastScanResult({
        status: "error",
        message,
      });
      toast.error(message);
    }
  }, [activeTrip, scanPassenger]);

  if (activeTrip === undefined) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!activeTrip) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Scan Passengers</h1>
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground mb-4">No active trip</p>
            <Button onClick={() => router.push("/driver/routes")}>
              Start a Trip First
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleEndTrip = async () => {
    if (confirm("Are you sure you want to end this trip?")) {
      await endTrip({ tripSessionId: activeTrip.trip._id });
      toast.success("Trip ended");
      router.push("/driver");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{activeTrip.route?.name}</h1>
          <p className="text-muted-foreground">
            Started {new Date(activeTrip.trip.startedAt).toLocaleTimeString()}
          </p>
        </div>
        <Button variant="destructive" onClick={handleEndTrip}>
          <StopCircle className="h-4 w-4 mr-2" />
          End Trip
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Scan QR Code</CardTitle>
          </CardHeader>
          <CardContent>
            <QRScanner onScan={handleScan} />
            
            {lastScanResult && (
              <div
                className={`mt-4 p-4 rounded-lg flex items-center gap-3 ${
                  lastScanResult.status === "success"
                    ? "bg-green-500/10 text-green-600"
                    : lastScanResult.status === "already_scanned"
                    ? "bg-yellow-500/10 text-yellow-600"
                    : "bg-red-500/10 text-red-600"
                }`}
              >
                {lastScanResult.status === "success" ? (
                  <CheckCircle className="h-5 w-5" />
                ) : lastScanResult.status === "already_scanned" ? (
                  <AlertCircle className="h-5 w-5" />
                ) : (
                  <AlertCircle className="h-5 w-5" />
                )}
                <div>
                  <p className="font-medium">{lastScanResult.message}</p>
                  {lastScanResult.passengerName && (
                    <p className="text-sm">{lastScanResult.passengerName}</p>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Scanned Passengers ({activeTrip.scans.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {activeTrip.scans.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No passengers scanned yet
              </p>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {activeTrip.scans
                  .slice()
                  .reverse()
                  .map((scan) => (
                    <div
                      key={scan._id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted"
                    >
                      <div>
                        <p className="font-medium">{scan.passenger?.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {scan.passenger?.email}
                        </p>
                      </div>
                      <Badge variant="outline">
                        {new Date(scan.scannedAt).toLocaleTimeString()}
                      </Badge>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
