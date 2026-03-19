import { EndpointState } from "@prisma/client";

import { Badge } from "@/components/ui/badge";

export function StatusBadge({ status }: { status: EndpointState | string }) {
  if (status === EndpointState.OK) return <Badge variant="success">OK</Badge>;
  if (status === EndpointState.WARNING) return <Badge variant="warning">Warning</Badge>;
  if (status === EndpointState.DOWN) return <Badge variant="destructive">Down</Badge>;
  return <Badge variant="neutral">Unknown</Badge>;
}
