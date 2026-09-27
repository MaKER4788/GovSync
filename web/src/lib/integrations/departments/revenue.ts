/**
 * SIMULATED REVENUE DEPARTMENT API.
 *
 * Land verification, application lookup and assessment receipts. No real land
 * record, parcel or deed is read: every answer is derived from the frozen
 * prototype dataset and the connector overlay.
 */

import { createDepartmentService } from "@/lib/integrations/departments/shared";
import type {
  DepartmentApplicationStatus,
  DepartmentProfile,
  DepartmentStatus,
} from "@/lib/integrations/types";

const DEPARTMENT_ID = "rev";

/** Land verification, in revenue's own vocabulary. */
export interface RevenueVerification {
  parcelId: string;
  landUse: string;
  ownership: "VERIFIED" | "PENDING" | "NOT_FOUND";
  encumbrance: "CLEAR" | "REGISTERED" | "UNKNOWN";
  feeStatus: "PAID" | "DUE" | "NOT_APPLICABLE";
  statement: string;
}

export interface RevenueStatus extends DepartmentApplicationStatus {
  verification: RevenueVerification;
}

export interface RevenueProfile extends DepartmentProfile {
  recordsHeld: string;
}

function verification(
  status: DepartmentStatus,
  applicantKind: string,
): RevenueVerification {
  return {
    parcelId: "118/B",
    landUse: "Industrial",
    ownership: status === "APPROVED" ? "VERIFIED" : "PENDING",
    encumbrance: status === "REJECTED" ? "REGISTERED" : "CLEAR",
    feeStatus: applicantKind === "business" ? "PAID" : "DUE",
    statement:
      status === "APPROVED"
        ? "Land ownership verified."
        : status === "REJECTED"
          ? "A registered encumbrance was found against the parcel."
          : "Land verification is in progress against the simulated parcel ledger.",
  };
}

export const revenueConnector = createDepartmentService<RevenueStatus, RevenueProfile>({
  departmentId: DEPARTMENT_ID,
  casePrefix: "RV",
  profile: {
    departmentId: DEPARTMENT_ID,
    departmentName: "Revenue Department",
    systemName: "Revenue Records Core (simulated)",
    baseUrl: "https://sim.revenue.govsync.example/v2",
    apiVersion: "v2.4",
    operations: [
      "GET_DEPARTMENT",
      "SUBMIT_APPLICATION",
      "GET_APPLICATION_STATUS",
      "VALIDATE_APPLICATION",
      "GET_REQUIRED_DOCUMENTS",
      "UPDATE_APPLICATION_STATUS",
    ],
    disclaimer:
      "Simulated service. No land record, parcel or deed is read from any real registry.",
    recordsHeld: "Land parcels, assessment ledger, registered deeds and fee receipts.",
  },
  enrich: ({ binding, status }) => ({
    verification: verification(status, binding.application.applicantKind),
  }),
});
