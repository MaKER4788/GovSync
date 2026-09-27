import type { Application, Approval, ApprovalAction, WorkflowState } from "@/lib/types";
import { stampOrder } from "@/lib/format";
import { applications, currentApproval } from "@/lib/data/applications";
import { departmentLabel } from "@/lib/data/departments";

/**
 * Derived views over the shared application record set.
 *
 * Approvals and actions are not stored twice. Every selector here reads the
 * single application record set, so a change to an application flows through
 * to the dashboard, the approvals list and the detail pages at once.
 */

export interface OpenApproval {
  applicationId: string;
  applicationTitle: string;
  approval: Approval;
}

export interface RequiredAction {
  applicationId: string;
  applicationTitle: string;
  approvalTitle: string;
  action: ApprovalAction;
}

/** Every stage that has not produced a decision yet, newest activity first. */
export function openApprovals(
  list: Application[] = applications,
): OpenApproval[] {
  return list
    .flatMap((application) =>
      application.approvals
        .filter((approval) => approval.state !== "approved")
        .map((approval) => ({
          applicationId: application.id,
          applicationTitle: application.title,
          approval,
        })),
    )
    .sort((a, b) => stampOrder(b.approval.startedAt) - stampOrder(a.approval.startedAt));
}

/** Stages queued behind an upstream decision, in approval order. */
export function pendingApprovals(
  list: Application[] = applications,
): OpenApproval[] {
  return openApprovals(list).filter(
    (entry) => entry.approval.state === "pending",
  );
}

export function pendingApprovalCount(list: Application[] = applications): number {
  return pendingApprovals(list).length;
}

/** Stages where the applicant has to do something before work can continue. */
export function requiredActions(
  list: Application[] = applications,
): RequiredAction[] {
  return list
    .filter((application) => application.state !== "completed")
    .flatMap((application) =>
      application.approvals
        .filter((approval) => approval.action)
        .map((approval) => ({
          applicationId: application.id,
          applicationTitle: application.title,
          approvalTitle: approval.title,
          action: approval.action as ApprovalAction,
        })),
    )
    .sort((a, b) => stampOrder(b.action.requestedAt) - stampOrder(a.action.requestedAt));
}

export function requiredActionCount(list: Application[] = applications): number {
  return requiredActions(list).length;
}

export function approvalsForApplication(
  applicationId: string,
): Approval[] {
  const application = applications.find(
    (candidate) => candidate.id === applicationId,
  );
  return application ? [...application.approvals].sort((a, b) => a.order - b.order) : [];
}

/** Where each open stage sits, grouped by the department that owns it. */
export function openApprovalsByDepartment(
  departmentId: string,
): OpenApproval[] {
  return openApprovals().filter(
    (entry) => entry.approval.departmentId === departmentId,
  );
}

export function countByState(
  state: WorkflowState,
  list: Application[] = applications,
): number {
  return list.reduce(
    (total, application) =>
      total + application.approvals.filter((approval) => approval.state === state)
        .length,
    0,
  );
}

export interface ApprovalSummary {
  applicationId: string;
  applicationTitle: string;
  state: string;
  stage: string;
  departmentId: string;
  department: string;
  progress: number;
  openStages: number;
}

/** One row per application, for the approvals list route. */
export function approvalSummaries(
  list: Application[] = applications,
): ApprovalSummary[] {
  return list
    .filter((application) => application.state !== "completed")
    .map((application) => {
      const stage = currentApproval(application);
      return {
        applicationId: application.id,
        applicationTitle: application.title,
        state: application.state,
        stage: stage?.title ?? "Completed",
        departmentId: stage?.departmentId ?? "govsync",
        department: departmentLabel(stage?.departmentId ?? "govsync"),
        progress: Math.round(
          application.approvals.reduce((sum, approval) => sum + approval.completion, 0) /
            Math.max(1, application.approvals.length),
        ),
        openStages: application.approvals.filter(
          (approval) => approval.state !== "approved",
        ).length,
      };
    });
}
