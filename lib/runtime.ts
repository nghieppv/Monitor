export function isVercelEnvironment() {
  return process.env.VERCEL === "1";
}

export function isNodeRuntime() {
  return !process.env.NEXT_RUNTIME || process.env.NEXT_RUNTIME === "nodejs";
}

export function hasValidCronSecret(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;

  const authorization = request.headers.get("authorization");
  return authorization === `Bearer ${secret}`;
}
