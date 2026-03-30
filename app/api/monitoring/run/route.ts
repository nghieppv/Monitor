import { ok, fail } from "@/lib/api";
// This route is deprecated since we moved to MSSQL-based data access; implement a no-op or simple status.
export async function POST() {
  // Return 501 Not Implemented to indicate we don't push via Prisma anymore
  return fail("Not implemented in MSSQL migration mode");
}

// Legacy Prisma-based run is removed in MSSQL migration
