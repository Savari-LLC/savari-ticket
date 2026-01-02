"use client";

import { use } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { QRDisplay } from "@/components/qr/qr-display";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Id } from "@/convex/_generated/dataModel";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function QRCodePage({ params }: PageProps) {
  const { id } = use(params);
  const passenger = useQuery(api.passengers.get, {
    passengerId: id as Id<"passengers">,
  });

  if (passenger === undefined) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (!passenger) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Passenger Not Found</h1>
        <Link href="/business/passengers">
          <Button>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Passengers
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/business/passengers">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">QR Code</h1>
      </div>

      <Card className="max-w-md mx-auto">
        <CardHeader className="text-center">
          <CardTitle>{passenger.name}</CardTitle>
          <p className="text-muted-foreground">{passenger.email}</p>
        </CardHeader>
        <CardContent className="flex justify-center">
          <QRDisplay
            value={passenger.qrCode}
            size={256}
            passengerName={passenger.name}
          />
        </CardContent>
      </Card>

      <Card className="max-w-md mx-auto">
        <CardContent className="pt-6">
          <h3 className="font-semibold mb-2">Instructions</h3>
          <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
            <li>Download the QR code using the button above</li>
            <li>Share the QR code with the passenger</li>
            <li>The passenger shows this QR code to the driver</li>
            <li>The driver scans it when boarding</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
