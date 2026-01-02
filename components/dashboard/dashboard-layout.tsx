"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { authClient } from "@/lib/auth-client";
import { RoleNav } from "./role-nav";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { LogOut, Menu } from "lucide-react";

type Role = "operator" | "driver" | "business";

interface DashboardLayoutProps {
  children: React.ReactNode;
  expectedRole: Role;
}

export function DashboardLayout({ children, expectedRole }: DashboardLayoutProps) {
  const router = useRouter();
  const membership = useQuery(api.operators.getMyMembership);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (membership === null) {
      router.push("/onboarding");
    } else if (membership && membership.membership.role !== expectedRole) {
      router.push(`/${membership.membership.role}`);
    }
  }, [membership, expectedRole, router]);

  if (membership === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
      </div>
    );
  }

  if (!membership || membership.membership.role !== expectedRole) {
    return null;
  }

  const handleSignOut = async () => {
    await authClient.signOut();
    router.push("/sign-in");
  };

  return (
    <div className="min-h-screen flex">
      {/* Mobile sidebar toggle */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-50 md:hidden"
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-card border-r transform transition-transform duration-200 ease-in-out md:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full p-4">
          <div className="mb-8">
            <h1 className="text-xl font-bold">{membership.operator?.name}</h1>
            <p className="text-sm text-muted-foreground capitalize">
              {membership.membership.role}
            </p>
          </div>

          <RoleNav role={expectedRole} />

          <div className="mt-auto pt-4 border-t">
            <div className="mb-2">
              <p className="text-sm font-medium">{membership.user?.name}</p>
              <p className="text-xs text-muted-foreground">{membership.user?.email}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start"
              onClick={handleSignOut}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </aside>

      {/* Backdrop for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <main className="flex-1 md:ml-64 p-6">
        {children}
      </main>
    </div>
  );
}
