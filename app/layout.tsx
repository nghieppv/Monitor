import type { Metadata } from "next";
import { JetBrains_Mono, Manrope } from "next/font/google";

import "@/app/globals.css";
import { PageShell } from "@/components/page-shell";

const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });

export const metadata: Metadata = {
  title: "Monitoring Dashboard",
  description: "Full-stack monitoring dashboard with alerting and admin management.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${manrope.variable} ${mono.variable} antialiased`}>
        <div className="grid-pattern min-h-screen">
          <PageShell>{children}</PageShell>
        </div>
      </body>
    </html>
  );
}
