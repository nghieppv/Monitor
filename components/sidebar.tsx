"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { navItems } from "@/lib/nav";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-full rounded-[28px] border border-white/50 bg-white/75 p-4 shadow-panel backdrop-blur xl:w-72">
      <div className="mb-6 rounded-2xl bg-slate-950 px-4 py-5 text-white">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Monitor Hub</p>
        <h1 className="mt-2 text-2xl font-bold">Operations Console</h1>
        <p className="mt-2 text-sm text-slate-300">Live endpoint health, company ownership, and alert settings.</p>
      </div>
      <nav className="space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition",
                active ? "bg-slate-950 text-white" : "text-slate-600 hover:bg-slate-100 hover:text-slate-950",
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
