import { json, readBody, refuse, roleFrom, segment } from "@/lib/integrations/http";
import { publishDecision, syncApplication } from "@/lib/integrations/operations";
import type { DepartmentStatus, IntegrationStatusUpdate } from "@/lib/integrations/types";

const DEPARTMENT_STATUSES: readonly DepartmentStatus[] = [
  "APPROVED",
  "IN_REVIEW",
  "PENDING",
  "ACTION_REQUIRED",
  "BLOCKED",
  "REJECTED",
];

/**
 * POST /api/govsync/departments/{department}/applications
 *
 * Body: `{ action, applicationId, stageId, status, reason, decidedBy }`
 *
 *   action "submit"  push a decision the workflow has already made
 *   action "sync"    flush the outbox, re-read every connector, reconcile
 *
 * A failed publish answers 503 with the local workflow state untouched. That is
 * the behaviour the endpoint exists to show: the caller learns the department
 * did not accept the decision, and the decision is still queued for the next
 * synchronisation rather than lost.
 */
export async function POST(
  request: Request,
  context: { params: Promise<{ department: string }> },
): Promise<Response> {
  const departmentId = await segment(context.params, "department");
  if (!departmentId) {
    return refuse("The route was called without a department id.");
  }

  const body = await readBody(request);
  if (!body.ok) return refuse(body.message);

  const record = body.value as Partial<IntegrationStatusUpdate> & { action?: string };

  if (record.action === "sync") {
    if (typeof record.applicationId !== "string" || record.applicationId.length === 0) {
      return refuse("A synchronisation needs an application reference.");
    }
    return json(syncApplication(record.applicationId, roleFrom(request)));
  }

  if (typeof record.applicationId !== "string" || record.applicationId.length === 0) {
    return refuse("A publication needs an application reference.");
  }
  if (typeof record.stageId !== "string" || record.stageId.length === 0) {
    return refuse("A publication needs a stage id.");
  }
  if (!record.status || !DEPARTMENT_STATUSES.includes(record.status)) {
    return refuse(
      `A publication needs a departmental status. Expected one of ${DEPARTMENT_STATUSES.join(", ")}.`,
    );
  }

  const update: IntegrationStatusUpdate = {
    applicationId: record.applicationId,
    departmentId,
    stageId: record.stageId,
    status: record.status,
    reason:
      typeof record.reason === "string" && record.reason
        ? record.reason
        : "No reason recorded against this decision.",
    decidedBy:
      typeof record.decidedBy === "string" && record.decidedBy
        ? record.decidedBy
        : "Demo Reviewer (platform operator)",
    recordedAt: "27 Sep 2026, 14:32",
  };

  return json(publishDecision(update, roleFrom(request)));
}
