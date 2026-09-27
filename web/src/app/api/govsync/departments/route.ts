import { json, roleFrom } from "@/lib/integrations/http";
import { readDepartments } from "@/lib/integrations/operations";

/**
 * GET /api/govsync/departments
 *
 * The connector registry as the portal sees it: what each simulated department
 * calls itself, where its base URL would point, which operations it exposes,
 * and its current health. Nothing here is a live endpoint.
 */
export async function GET(request: Request): Promise<Response> {
  return json(readDepartments(roleFrom(request)));
}
