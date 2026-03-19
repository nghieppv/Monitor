import type { Route } from "next";
import { LayoutDashboard, Building2, Waypoints, LineChart, Settings } from "lucide-react";

export const navItems = [
  { href: "/" as Route, label: "Dashboard", icon: LayoutDashboard },
  { href: "/companies" as Route, label: "Companies", icon: Building2 },
  { href: "/endpoints" as Route, label: "Endpoints", icon: Waypoints },
  { href: "/history" as Route, label: "History", icon: LineChart },
  { href: "/settings" as Route, label: "Settings", icon: Settings },
];
