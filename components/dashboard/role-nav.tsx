"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Route,
  Users,
  BarChart3,
  UserPlus,
  History,
  ScanLine,
} from "lucide-react";

type Role = "operator" | "driver" | "business";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navItems: Record<Role, NavItem[]> = {
  operator: [
    { href: "/operator", label: "Dashboard", icon: LayoutDashboard },
    { href: "/operator/routes", label: "Routes", icon: Route },
    { href: "/operator/members", label: "Members", icon: Users },
    { href: "/operator/reports", label: "Reports", icon: BarChart3 },
  ],
  driver: [
    { href: "/driver", label: "Dashboard", icon: LayoutDashboard },
    { href: "/driver/routes", label: "Routes", icon: Route },
    { href: "/driver/scan", label: "Scan", icon: ScanLine },
    { href: "/driver/history", label: "History", icon: History },
  ],
  business: [
    { href: "/business", label: "Dashboard", icon: LayoutDashboard },
    { href: "/business/passengers", label: "Passengers", icon: UserPlus },
  ],
};

interface RoleNavProps {
  role: Role;
}

export function RoleNav({ role }: RoleNavProps) {
  const pathname = usePathname();
  const items = navItems[role] || [];

  return (
    <nav className="flex flex-col gap-1">
      {items.map((item) => {
        const isActive = pathname === item.href || 
          (item.href !== `/${role}` && pathname.startsWith(item.href));
        
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
