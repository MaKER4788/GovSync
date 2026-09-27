/**
 * SIMULATED LABOUR DEPARTMENT API.
 *
 * Establishment and factory registration: intake, validation, document
 * requirements and status lookup.
 */

import { createDepartmentService } from "@/lib/integrations/departments/shared";
import type {
  DepartmentApplicationStatus,
  DepartmentProfile,
  DepartmentStatus,
} from "@/lib/integrations/types";

const DEPARTMENT_ID = "lab";

/** Registration state, in the commissioner's own vocabulary. */
export interface LabourRegistration {
  registrationClass: string;
  establishmentMatched: boolean;
  headcountDeclared: number;
  inspection: "NOT_BOOKED" | "BOOKED" | "COMPLETED";
  duesStatus: "CLEAR" | "DUE" | "UNDER_ASSESSMENT";
  statement: string;
}

export interface LabourStatus extends DepartmentApplicationStatus {
  registration: LabourRegistration;
}

export interface LabourProfile extends DepartmentProfile {
  registersHeld: string;
}

function registration(status: DepartmentStatus): LabourRegistration {
  return {
    registrationClass: "Factory",
    establishmentMatched: true,
    headcountDeclared: 64,
    inspection: status === "APPROVED" ? "COMPLETED" : "NOT_BOOKED",
    duesStatus: status === "APPROVED" ? "CLEAR" : "UNDER_ASSESSMENT",
    statement:
      status === "APPROVED"
        ? "Establishment registered and the registration certificate is published."
        : status === "REJECTED"
          ? "The establishment record did not match. A correction has been asked for."
          : "Registration is open. The case cannot be registered until the fire clearance is published.",
  };
}

export const labourConnector = createDepartmentService<LabourStatus, LabourProfile>({
  departmentId: DEPARTMENT_ID,
  casePrefix: "LAB",
  profile: {
    departmentId: DEPARTMENT_ID,
    departmentName: "Labour Department",
    systemName: "Establishment Registry (simulated)",
    baseUrl: "https://sim.labour.govsync.example/v1",
    apiVersion: "v1.6",
    operations: [
      "GET_DEPARTMENT",
      "SUBMIT_APPLICATION",
      "GET_APPLICATION_STATUS",
      "VALIDATE_APPLICATION",
      "GET_REQUIRED_DOCUMENTS",
      "UPDATE_APPLICATION_STATUS",
    ],
    disclaimer:
      "Simulated service. No establishment record, factory licence or inspection history is read from any real registry.",
    registersHeld:
      "Establishment registration, factory licence workflow, inspection scheduling, employee muster linkage.",
  },
  enrich: ({ status }) => ({ registration: registration(status) }),
});
