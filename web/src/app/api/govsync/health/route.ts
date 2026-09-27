import { json, roleFrom } from "@/lib/integrations/http";
import { readHealth } from "@/lib/integrations/operations";

/**
 * GET /api/govsync/health
 *
 * Connector health and session counters. Requires the monitoring scope, so an
 * applicant role is refused with 403 rather than shown platform telemetry.
 */
export async function GET(request: Request): Promise<Response> {
  return json(readHealth(roleFrom(request)));
}
