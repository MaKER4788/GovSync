/**
 * SIMULATED POLLUTION CONTROL API.
 *
 * Consent to Establish and Consent to Operate, effluent reporting and
 * compliance notices. The board validates the information it needs, reports
 * which documents are still outstanding and can be asked to record a decision.
 */

import { createDepartmentService } from "@/lib/integrations/departments/shared";
import type {
  DepartmentApplicationStatus,
  DepartmentProfile,
  DepartmentStatus,
} from "@/lib/integrations/types";

const DEPARTMENT_ID = "pol";

/** Consent state, in the board's own vocabulary. */
export interface PollutionConsent {
  consentType: "CTE" | "CTO" | "HAZARDOUS_WASTE" | "NONE";
  category: string;
  inspection: "SCHEDULED" | "COMPLETED" | "NOT_REQUIRED" | "AWAITING_INSPECTION";
  effluentSamples: number;
  nextAction: string;
}

export interface PollutionStatus extends DepartmentApplicationStatus {
  consent: PollutionConsent;
}

export interface PollutionProfile extends DepartmentProfile {
  registersHeld: string;
}

function consent(status: DepartmentStatus): PollutionConsent {
  switch (status) {
    case "APPROVED":
      return {
        consentType: "CTE",
        category: "Consent to Establish",
        inspection: "COMPLETED",
        effluentSamples: 3,
        nextAction: "Consent reference published to downstream departments.",
      };
    case "REJECTED":
      return {
        consentType: "NONE",
        category: "Consent to Establish",
        inspection: "COMPLETED",
        effluentSamples: 3,
        nextAction: "A correction has been asked for before the case can reopen.",
      };
    case "ACTION_REQUIRED":
      return {
        consentType: "CTE",
        category: "Consent to Establish",
        inspection: "AWAITING_INSPECTION",
        effluentSamples: 3,
        nextAction: "Waiting on a document from the applicant.",
      };
    default:
      return {
        consentType: "CTE",
        category: "Consent to Establish",
        inspection: "SCHEDULED",
        effluentSamples: 2,
        nextAction: "Inspection cannot be scheduled until the outstanding drawing is received.",
      };
  }
}

export const pollutionConnector = createDepartmentService<PollutionStatus, PollutionProfile>({
  departmentId: DEPARTMENT_ID,
  casePrefix: "PCB",
  profile: {
    departmentId: DEPARTMENT_ID,
    departmentName: "Pollution Control Board",
    systemName: "Consent Management System (simulated)",
    baseUrl: "https://sim.pollution.govsync.example/v1",
    apiVersion: "v1.9",
    operations: [
      "GET_DEPARTMENT",
      "SUBMIT_APPLICATION",
      "GET_APPLICATION_STATUS",
      "VALIDATE_APPLICATION",
      "GET_REQUIRED_DOCUMENTS",
      "UPDATE_APPLICATION_STATUS",
    ],
    disclaimer:
      "Simulated service. No environmental record, sampling result or consent register is read from any real system.",
    registersHeld:
      "Consent to Establish and Operate, hazardous waste authorisations, compliance notice registry.",
  },
  enrich: ({ status }) => ({ consent: consent(status) }),
});
