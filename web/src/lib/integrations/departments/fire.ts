/**
 * SIMULATED FIRE DEPARTMENT API.
 *
 * Fire no-objection certificates: application intake, document requirements,
 * status lookup and validation.
 *
 * The NOC depends on the pollution consent being issued. That ordering is
 * deliberately NOT encoded here. This service reports what it holds and what it
 * is still waiting for as a free-text remark; the GovSync layer owns the
 * dependency graph and decides when this stage may open. A real fire service
 * would not know about the pollution board's case either.
 */

import { createDepartmentService } from "@/lib/integrations/departments/shared";
import type {
  DepartmentApplicationStatus,
  DepartmentProfile,
  DepartmentStatus,
} from "@/lib/integrations/types";

const DEPARTMENT_ID = "fire";

/** NOC state, in the directorate's own vocabulary. */
export interface FireNoc {
  occupancyClass: string;
  layoutPrecheck: "PASSED" | "PENDING" | "FAILED" | "NOT_RUN";
  auditSlot: string;
  awaitingReference: string | null;
  statement: string;
}

export interface FireStatus extends DepartmentApplicationStatus {
  noc: FireNoc;
}

export interface FireProfile extends DepartmentProfile {
  certificatesIssued: string;
}

function noc(status: DepartmentStatus, stageRemark: string): FireNoc {
  const awaitingReference = status === "APPROVED" ? null : "Pollution consent reference";
  return {
    occupancyClass: "Class II",
    layoutPrecheck: status === "REJECTED" ? "FAILED" : "PASSED",
    auditSlot: "06 Oct 2026, 10:30",
    awaitingReference,
    statement:
      status === "APPROVED"
        ? "NOC issued."
        : `NOC issuance is on hold. ${stageRemark}`,
  };
}

export const fireConnector = createDepartmentService<FireStatus, FireProfile>({
  departmentId: DEPARTMENT_ID,
  casePrefix: "FSD",
  profile: {
    departmentId: DEPARTMENT_ID,
    departmentName: "Fire Department",
    systemName: "NOC Clearance Grid (simulated)",
    baseUrl: "https://sim.fire.govsync.example/v1",
    apiVersion: "v1.3",
    operations: [
      "GET_DEPARTMENT",
      "SUBMIT_APPLICATION",
      "GET_APPLICATION_STATUS",
      "VALIDATE_APPLICATION",
      "GET_REQUIRED_DOCUMENTS",
      "UPDATE_APPLICATION_STATUS",
    ],
    disclaimer:
      "Simulated service. No no-objection certificate, fire audit record or occupancy classification is read from any real register.",
    certificatesIssued:
      "Fire NOC, audit slot booking, occupancy classification support, revocation notices.",
  },
  enrich: ({ binding, status }) => ({
    noc: noc(status, binding.track?.remark ?? binding.approval.remark),
  }),
});
