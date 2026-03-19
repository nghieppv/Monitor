import { startMonitoringWorker } from "@/lib/monitoring";
import { isNodeRuntime, isVercelEnvironment } from "@/lib/runtime";

export async function register() {
  if (!isNodeRuntime() || isVercelEnvironment()) {
    return;
  }

  await startMonitoringWorker();
}
