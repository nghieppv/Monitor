import { ReactNode } from "react";

import { Sidebar } from "@/components/sidebar";

export function PageShell({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[1600px] flex-col gap-6 px-4 py-4 xl:flex-row xl:px-6 xl:py-6">
      <Sidebar />
      <main className="flex-1 rounded-[32px] border border-white/60 bg-white/70 p-4 shadow-panel backdrop-blur md:p-6">
        {children}
      </main>
    </div>
  );
}
