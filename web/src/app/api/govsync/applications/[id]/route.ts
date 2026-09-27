import { json, refuse, roleFrom, segment } from "@/lib/integrations/http";
import { readApplication } from "@/lib/integrations/operations";

/**
 * GET /api/govsync/applications/{id}
 *
 * One application as the integration layer reads it: the record set, the stage
 * chain the Phase 3 engine derives from it, and the stages that have no
 * connector in this phase. No department is called, so this is a platform read.
 */
export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  const applicationId = await segment(context.params, "id");
  if (!applicationId) {
    return refuse("The route was called without an application reference.");
  }
  return json(readApplication(applicationId, roleFrom(request)));
}
