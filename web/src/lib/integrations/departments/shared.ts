/**
 * Shared plumbing for the simulated department services.
 *
 * Every service reads the same frozen record set the portal already renders and
 * layers the connector overlay on top: once GovSync publishes a decision to a
 * department, the store holds that department's answer and the service reports
 * it. The record set is never mutated.
 *
 * The six standardised operations are implemented once, here, by
 * `createDepartmentService`. Each department module supplies only its profile
 * and its own status vocabulary, which keeps the four services modular without
 * four copies of the same request handling.
 */

import { applicationById } from "@/lib/data/applications";
import { departmentById } from "@/lib/data/departments";
import type { Approval, Application, DepartmentTrack } from "@/lib/types";
import { integrationStore } from "@/lib/integrations/store";
import {
  departmentalise,
  makeFault,
  type ConnectorRequest,
  type DepartmentApplicationStatus,
  type DepartmentCheck,
  type DepartmentConnector,
  type DepartmentDocumentRef,
  type DepartmentDocuments,
  type DepartmentEnvelope,
  type DepartmentProfile,
  type DepartmentStatus,
  type DepartmentStatusUpdatePayload,
  type DepartmentSubmission,
  type DepartmentSubmissionPayload,
  type DepartmentValidation,
  type InjectedFailureMode,
} from "@/lib/integrations/types";

/** The record a service needs in order to answer any call about one application. */
export interface DepartmentBinding {
  application: Application;
  approval: Approval;
  track: DepartmentTrack | undefined;
}

/**
 * Resolves the case a department holds for one stage.
 *
 * A department can appear more than once in an approval chain, so the stage is
 * the unit of work, not the department. `stageId` is therefore honoured when it
 * is supplied, and only falls back to the first stage for the department when a
 * caller genuinely has no stage in mind.
 */
export function bindingFor(
  applicationId: string,
  departmentId: string,
  stageId?: string,
): DepartmentBinding | null {
  const application = applicationById(applicationId);
  if (!application) return null;
  const approval = stageId
    ? application.approvals.find(
        (candidate) => candidate.departmentId === departmentId && candidate.id === stageId,
      )
    : application.approvals.find((candidate) => candidate.departmentId === departmentId);
  if (!approval) return null;
  return {
    application,
    approval,
    track: application.tracks.find(
      (candidate) => candidate.departmentId === departmentId,
    ),
  };
}

/**
 * What the department currently holds: the connector overlay if GovSync has
 * published something, otherwise the recorded state from the dataset.
 */
export function heldStatus(
  applicationId: string,
  departmentId: string,
  stageId?: string,
): DepartmentStatus {
  const overlay = integrationStore().connectorState(applicationId, departmentId, stageId);
  if (overlay) return overlay.status;
  const binding = bindingFor(applicationId, departmentId, stageId);
  return binding ? departmentalise(binding.approval.state) : "PENDING";
}

export function heldReference(applicationId: string, departmentId: string): string {
  const overlay = integrationStore().connectorState(applicationId, departmentId);
  if (overlay) return overlay.reference;
  const numeric = applicationId.split("-").pop() ?? "0000";
  switch (departmentId) {
    case "rev":
      return `REV/2026/${numeric}/118-B`;
    case "pol":
      return `PCB/CTE/2026/${numeric}`;
    case "fire":
      return `FSD/NOC/2026/${numeric}`;
    case "lab":
      return `LAB/REG/2026/${numeric}`;
    default:
      return `SIM/${numeric}`;
  }
}

export function heldAt(
  applicationId: string,
  departmentId: string,
  stageId?: string,
): string {
  const overlay = integrationStore().connectorState(applicationId, departmentId, stageId);
  if (overlay) return overlay.updatedAt;
  const binding = bindingFor(applicationId, departmentId, stageId);
  return (
    binding?.track?.lastUpdated ??
    binding?.application.lastUpdated ??
    "27 Sep 2026, 14:32"
  );
}

export function documentsFor(
  track: DepartmentTrack | undefined,
): DepartmentDocumentRef[] {
  if (!track) return [];
  return track.documents.map((document) => ({
    name: document.name,
    mandatory: document.mandatory,
    owedBy: document.owedBy,
    state: document.state,
    ...(document.note === undefined ? {} : { note: document.note }),
  }));
}

/** Simulated round-trip time, scaled from the record's own p95 figure. */
export function latencyFor(departmentId: string): number {
  const p95 = departmentById(departmentId)?.p95LatencyMs ?? 400;
  return Math.max(35, Math.round(p95 / 3));
}

/** The slug a department publishes in its own responses. */
export function slugFor(departmentId: string): string {
  switch (departmentId) {
    case "rev":
      return "revenue-department";
    case "pol":
      return "pollution-control";
    case "fire":
      return "fire-department";
    case "lab":
      return "labour-department";
    default:
      return departmentId;
  }
}

export function ok<TData>(
  slug: string,
  applicationId: string | null,
  status: DepartmentStatus | null,
  at: string,
  data: TData,
): DepartmentEnvelope<TData> {
  return {
    success: true,
    department: slug,
    applicationId,
    status,
    timestamp: at,
    source: "SIMULATED_DEPARTMENT_API",
    data,
    error: null,
  };
}

export function fail<TData>(
  slug: string,
  applicationId: string | null,
  at: string,
  code: Parameters<typeof makeFault>[0],
  message: string,
  detail?: string,
): DepartmentEnvelope<TData> {
  return {
    success: false,
    department: slug,
    applicationId,
    status: null,
    timestamp: at,
    source: "SIMULATED_DEPARTMENT_API",
    data: null,
    error: makeFault(code, message, detail),
  };
}

const FAULT_BY_MODE: Record<
  InjectedFailureMode,
  { code: Parameters<typeof makeFault>[0]; message: string; detail: string }
> = {
  unavailable: {
    code: "DEPARTMENT_UNAVAILABLE",
    message: "The simulated department service is currently unavailable.",
    detail: "The connector could not open a session with the simulated endpoint.",
  },
  timeout: {
    code: "DEPARTMENT_TIMEOUT",
    message: "The simulated department service did not respond in time.",
    detail: "No response was received inside the connector's request budget.",
  },
  malformed: {
    code: "MALFORMED_RESPONSE",
    message: "The simulated department service returned a response GovSync cannot read.",
    detail: "The payload arrived without a readable status field.",
  },
  validation: {
    code: "INVALID_REQUEST",
    message: "The simulated department service rejected the request as invalid.",
    detail: "A required field in the submitted payload was missing or malformed.",
  },
};

/**
 * Applies a demo-planned failure. A malformed response is returned as a
 * successful envelope carrying no data, so it is the normalisation step that
 * detects it rather than the connector.
 */
export function injectedFault<TData>(
  slug: string,
  applicationId: string | null,
  at: string,
  mode: InjectedFailureMode,
): DepartmentEnvelope<TData> {
  const fault = FAULT_BY_MODE[mode];
  if (mode === "malformed") {
    return {
      success: true,
      department: slug,
      applicationId,
      status: null,
      timestamp: at,
      source: "SIMULATED_DEPARTMENT_API",
      data: null,
      error: makeFault(fault.code, fault.message, fault.detail),
    };
  }
  return fail(slug, applicationId, at, fault.code, fault.message, fault.detail);
}

/** Derives the checks a department reports for one application. */
export function checksFor(
  binding: DepartmentBinding,
  documents: DepartmentDocumentRef[],
): DepartmentCheck[] {
  const missing = documents.filter(
    (document) =>
      document.mandatory &&
      document.state === "pending" &&
      document.owedBy === "applicant",
  );
  return [
    {
      field: "application.applicantName",
      label: "Applicant identity",
      outcome: "PASS",
      detail: `Identity reference accepted for ${binding.application.applicantName}.`,
    },
    {
      field: "application.district",
      label: "Jurisdiction",
      outcome: "PASS",
      detail: `${binding.application.district} falls inside this department's simulated jurisdiction.`,
    },
    {
      field: "stage.dependsOn",
      label: "Upstream artefacts",
      outcome: binding.approval.dependsOn.length === 0 ? "PASS" : "WARN",
      detail:
        binding.approval.dependsOn.length === 0
          ? "This stage has no upstream dependency."
          : `${binding.approval.dependsOn.length} upstream artefact reference${
              binding.approval.dependsOn.length === 1 ? "" : "s"
            } declared. GovSync resolves the ordering, not this service.`,
    },
    {
      field: "documents.mandatory",
      label: "Mandatory documents",
      outcome: missing.length === 0 ? "PASS" : "WARN",
      detail:
        missing.length === 0
          ? "Every mandatory document is present."
          : `Waiting on ${missing.map((document) => document.name).join(", ")}.`,
    },
  ];
}

/* -------------------------------------------------------------------------- */
/* The shared service implementation                                           */
/* -------------------------------------------------------------------------- */

/** Fields a department adds on top of the common status record. */
export type StatusExtension = Record<string, unknown>;

export interface DepartmentServiceConfig<TProfile extends DepartmentProfile = DepartmentProfile> {
  departmentId: string;
  profile: TProfile;
  /** The department's own view of a case, in its own vocabulary. */
  enrich: (input: {
    binding: DepartmentBinding;
    status: DepartmentStatus;
    reference: string;
    updatedAt: string;
  }) => StatusExtension;
  /** Case identifier this department issues when a case is opened. */
  casePrefix: string;
}

type Service<TStatus extends DepartmentApplicationStatus, TProfile extends DepartmentProfile> =
  DepartmentConnector<TStatus, TProfile>;

/**
 * Builds one simulated department service. All six operations are handled
 * identically across departments, which is the point of the contract: the
 * integration layer cannot tell them apart, and does not need to.
 */
export function createDepartmentService<
  TStatus extends DepartmentApplicationStatus,
  TProfile extends DepartmentProfile,
>(config: DepartmentServiceConfig<TProfile>): Service<TStatus, TProfile> {
  const { departmentId, profile, enrich, casePrefix } = config;
  const slug = slugFor(departmentId);

  const requireApplication = (
    request: ConnectorRequest<unknown>,
    stageId?: string,
  ): DepartmentBinding | DepartmentEnvelope<never> => {
    if (!request.applicationId) {
      return fail(
        slug,
        null,
        request.at,
        "INVALID_REQUEST",
        `${profile.departmentName} requires an application reference.`,
        "The call reached the connector without an applicationId.",
      );
    }
    const binding = bindingFor(request.applicationId, departmentId, stageId);
    if (!binding) {
      return fail(
        slug,
        request.applicationId,
        request.at,
        "UNKNOWN_APPLICATION",
        `${profile.departmentName} has no record of this application.`,
        `No simulated case exists for ${request.applicationId} in ${profile.systemName}.`,
      );
    }
    return binding;
  };

  /** Reads the stage a caller means, from whichever payload it arrived in. */
  const stageOf = (request: ConnectorRequest<unknown>): string | undefined => {
    const payload = request.payload as { stageId?: unknown } | null;
    return typeof payload?.stageId === "string" && payload.stageId.length > 0
      ? payload.stageId
      : undefined;
  };

  const statusFor = (
    applicationId: string,
    stageId: string | undefined,
    at: string,
  ): DepartmentEnvelope<TStatus> => {
    const binding = bindingFor(applicationId, departmentId, stageId);
    if (!binding) {
      return fail(slug, applicationId, at, "MALFORMED_RESPONSE", "Record could not be read.");
    }
    const status = heldStatus(applicationId, departmentId, binding.approval.id);
    const reference = heldReference(applicationId, departmentId);
    const updatedAt = heldAt(applicationId, departmentId, binding.approval.id);
    return ok(slug, applicationId, status, at, {
      applicationId,
      stageId: binding.approval.id,
      stageTitle: binding.approval.title,
      status,
      updatedAt,
      reference,
      remarks: binding.track?.remark ?? binding.approval.remark,
      issuedArtifacts: status === "APPROVED" ? binding.approval.outputArtifacts : [],
      ...enrich({ binding, status, reference, updatedAt }),
    } as TStatus);
  };

  const guard = <TData>(
    request: ConnectorRequest<unknown>,
  ): DepartmentEnvelope<TData> | null => {
    if (!request.injected) return null;
    return injectedFault<TData>(slug, request.applicationId, request.at, request.injected);
  };

  return {
    departmentId,
    departmentSlug: slug,

    getDepartment(): DepartmentEnvelope<TProfile> {
      return ok(slug, null, null, integrationStore().now(), {
        ...profile,
        systemName: departmentById(departmentId)?.systemName ?? profile.systemName,
        baseUrl: departmentById(departmentId)?.baseUrl ?? profile.baseUrl,
      });
    },

    getApplicationStatus(request: ConnectorRequest): DepartmentEnvelope<TStatus> {
      const injected = guard<TStatus>(request);
      if (injected) return injected;
      const resolved = requireApplication(request, stageOf(request));
      if ("success" in resolved) return resolved as DepartmentEnvelope<TStatus>;
      return statusFor(resolved.application.id, resolved.approval.id, request.at);
    },

    validateApplication(
      request: ConnectorRequest<DepartmentSubmissionPayload>,
    ): DepartmentEnvelope<DepartmentValidation> {
      const injected = guard<DepartmentValidation>(request);
      if (injected) return injected;
      const resolved = requireApplication(request, stageOf(request));
      if ("success" in resolved) {
        return resolved as unknown as DepartmentEnvelope<DepartmentValidation>;
      }
      const documents = documentsFor(resolved.track);
      return ok(slug, resolved.application.id, heldStatus(resolved.application.id, departmentId), request.at, {
        applicationId: resolved.application.id,
        stageId: resolved.approval.id,
        valid: documents.every(
          (document) => !document.mandatory || document.state !== "pending",
        ),
        checks: checksFor(resolved, documents),
        validatedAt: request.at,
      });
    },

    getRequiredDocuments(
      request: ConnectorRequest,
    ): DepartmentEnvelope<DepartmentDocuments> {
      const injected = guard<DepartmentDocuments>(request);
      if (injected) return injected;
      const resolved = requireApplication(request, stageOf(request));
      if ("success" in resolved) {
        return resolved as unknown as DepartmentEnvelope<DepartmentDocuments>;
      }
      return ok(slug, resolved.application.id, heldStatus(resolved.application.id, departmentId), request.at, {
        applicationId: resolved.application.id,
        stageId: resolved.approval.id,
        documents: documentsFor(resolved.track),
      });
    },

    submitApplication(
      request: ConnectorRequest<DepartmentSubmissionPayload>,
    ): DepartmentEnvelope<DepartmentSubmission> {
      const injected = guard<DepartmentSubmission>(request);
      if (injected) return injected;
      const resolved = requireApplication(request);
      if ("success" in resolved) {
        return resolved as unknown as DepartmentEnvelope<DepartmentSubmission>;
      }
      return ok(slug, resolved.application.id, "IN_REVIEW", request.at, {
        applicationId: resolved.application.id,
        stageId: resolved.approval.id,
        caseId: `${casePrefix}-${resolved.application.id}`,
        acceptedAt: request.at,
        receivedDocuments: (request.payload?.documents ?? []).length,
      });
    },

    updateApplicationStatus(
      request: ConnectorRequest<DepartmentStatusUpdatePayload>,
    ): DepartmentEnvelope<TStatus> {
      const injected = guard<TStatus>(request);
      if (injected) return injected;

      const payload = request.payload;
      const resolved = requireApplication(request, stageOf(request));
      if ("success" in resolved) return resolved as DepartmentEnvelope<TStatus>;

      if (!payload?.status) {
        return fail(
          slug,
          resolved.application.id,
          request.at,
          "INVALID_REQUEST",
          `${profile.departmentName} rejected the status update as invalid.`,
          "updateApplicationStatus requires a status field.",
        );
      }

      integrationStore().setConnectorState({
        applicationId: resolved.application.id,
        departmentId,
        stageId: resolved.approval.id,
        status: payload.status,
        updatedAt: request.at,
        reference: heldReference(resolved.application.id, departmentId),
        lastRequestId: null,
      });
      return statusFor(resolved.application.id, resolved.approval.id, request.at);
    },
  };
}
