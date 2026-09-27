import { json, readBody, refuse, roleFrom, segment } from "@/lib/integrations/http";
import { resetDepartmentState, syncApplication } from "@/lib/integrations/operations";

/**
 * POST /api/govsync/workflow/{id}/sync
 *
 * Body: `{ mode: "sync" | "reset" }`, defaulting to `"sync"`.
 *
 *   sync   flush queued decisions, re-read every connector, reconcile the graph
 *   reset  discard the outbox and return departmental records to the dataset
 *
 * A sync is safe to call repeatedly and never mutates the canonical records: it
 * reconciles the session's workflow view against departmental answers.
 */
export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  const applicationId = await segment(context.params, "id");
  if (!applicationId) {
    return refuse("The route was called without a workflow id.");
  }

  const body = await readBody(request);
  if (!body.ok) return refuse(body.message);

  const mode = (body.value as { mode?: string } | null)?.mode ?? "sync";
  if (mode !== "sync" && mode !== "reset") {
    return refuse(`Unknown mode "${mode}". Use "sync" or "reset".`);
  }

  return json(
    mode === "reset"
      ? resetDepartmentState(applicationId, roleFrom(request))
      : syncApplication(applicationId, roleFrom(request)),
  );
}
