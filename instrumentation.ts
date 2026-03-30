// Lazy/server-only import to avoid pulling Node/MSSQL libs into client bundle
export async function register() {
  if (typeof window !== "undefined") {
    // Ensure this runs only on server
    return;
  }
  const mod = await import("@/lib/monitoring");
  if (typeof mod.startMonitoringWorker === "function") {
    await mod.startMonitoringWorker();
  }
}
