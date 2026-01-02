"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Bus, Users, QrCode, BarChart3 } from "lucide-react";
import Link from "next/link";

export default function HomePage() {
  const router = useRouter();
  const membership = useQuery(api.operators.getMyMembership);

  useEffect(() => {
    if (membership) {
      router.push(`/${membership.membership.role}`);
    }
  }, [membership, router]);

  if (membership === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Savari Ticket</h1>
          <div className="flex gap-2">
            <Link href="/sign-in">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link href="/sign-up">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="py-20 px-4">
          <div className="container mx-auto text-center max-w-3xl">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Passenger Management Made Simple
            </h2>
            <p className="text-xl text-muted-foreground mb-8">
              A complete multi-tenant ticket system for transport operators. 
              Manage routes, track passengers with QR codes, and get real-time insights.
            </p>
            <div className="flex gap-4 justify-center">
              <Link href="/sign-up">
                <Button size="lg">Start Free</Button>
              </Link>
              <Link href="/sign-in">
                <Button size="lg" variant="outline">Sign In</Button>
              </Link>
            </div>
          </div>
        </section>

        <section className="py-16 px-4 bg-muted/50">
          <div className="container mx-auto">
            <h3 className="text-2xl font-bold text-center mb-12">
              Built for Modern Transport Operations
            </h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader>
                  <Bus className="h-10 w-10 mb-2 text-primary" />
                  <CardTitle>Route Management</CardTitle>
                  <CardDescription>
                    Create and manage routes with ease. Track active trips in real-time.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <Users className="h-10 w-10 mb-2 text-primary" />
                  <CardTitle>Multi-Tenant</CardTitle>
                  <CardDescription>
                    Each operator has their own isolated workspace with drivers and businesses.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <QrCode className="h-10 w-10 mb-2 text-primary" />
                  <CardTitle>QR Ticketing</CardTitle>
                  <CardDescription>
                    Generate unique QR codes for passengers. Scan and track boardings instantly.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <BarChart3 className="h-10 w-10 mb-2 text-primary" />
                  <CardTitle>Analytics</CardTitle>
                  <CardDescription>
                    Get insights on passenger counts, route performance, and driver activity.
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>
        </section>

        <section className="py-16 px-4">
          <div className="container mx-auto max-w-4xl">
            <h3 className="text-2xl font-bold text-center mb-12">
              Three User Roles, One Platform
            </h3>
            <div className="grid md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Operator</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• Create and manage routes</li>
                    <li>• Invite drivers and businesses</li>
                    <li>• View comprehensive reports</li>
                    <li>• Monitor all operations</li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Driver</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• Start trips on routes</li>
                    <li>• Scan passenger QR codes</li>
                    <li>• View trip history</li>
                    <li>• Track passenger counts</li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Business</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• Add passengers</li>
                    <li>• Generate QR codes</li>
                    <li>• Download tickets</li>
                    <li>• Manage passenger list</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t py-8 px-4">
        <div className="container mx-auto text-center text-muted-foreground">
          <p>&copy; 2024 Savari Ticket. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}