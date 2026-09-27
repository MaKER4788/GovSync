import { json, refuse, roleFrom, segment } from "@/lib/integrations/http";
import { readDepartmentStatus } from "@/lib/integrations/operations";

/**
 * GET /api/govsync/departments/{department}/status/{applicationId}
 *
 * One stage, as one department states it. This is the endpoint a departmental
 * client would call to check a single case, and the one to hit when reviewing
 * how a departmental dialect is normalised onto the GovSync vocabulary.
 */
export async function GET(
  request: Request,
  context: { params: Promise<{ department: string; applicationId: string }> },
): Promise<Response> {
  const departmentId = await segment(context.params, "department");
  const applicationId = await segment(context.params, "applicationId");
  if (!departmentId || !applicationId) {
    return refuse("The route needs both a department id and an application reference.");
  }

  return json(readDepartmentStatus(applicationId, departmentId, roleFrom(request)));
}
