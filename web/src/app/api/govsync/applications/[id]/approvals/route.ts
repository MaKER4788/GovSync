import { json, refuse, roleFrom, segment } from "@/lib/integrations/http";
import { readApprovals } from "@/lib/integrations/operations";

/**
 * GET /api/govsync/applications/{id}/approvals
 *
 * Every departmental answer for one application, read back through each
 * connector rather than from the record set. This is the call that proves the
 * interop path: four connectors, four dialects, one response shape.
 */
export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  const applicationId = await segment(context.params, "id");
  if (!applicationId) {
    return refuse("The route was called without an application reference.");
  }
  return json(readApprovals(applicationId, roleFrom(request)));
}
