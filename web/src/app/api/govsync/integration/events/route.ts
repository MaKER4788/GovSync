import { json, roleFrom } from "@/lib/integrations/http";
import { readIntegrationLog } from "@/lib/integrations/operations";

/**
 * GET /api/govsync/integration/events?applicationId=...
 *
 * Everything the debug view needs in one read: session counters, per-connector
 * health, the append-only event log, the hop-by-hop traces, the audit log, the
 * failure plans still in force, and an honest statement of which security
 * controls are enforced, which are placeholders, and which do not exist.
 */
export async function GET(request: Request): Promise<Response> {
  const applicationId = new URL(request.url).searchParams.get("applicationId") ?? undefined;
  return json(readIntegrationLog(roleFrom(request), applicationId));
}
