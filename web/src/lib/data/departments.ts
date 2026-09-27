import type { ArchitectureLayer, Department, ServiceCatalogueEntry } from "@/lib/types";
import { DEMO_TODAY } from "@/lib/format";

/**
 * SIMULATED ENVIRONMENT NOTICE
 * ------------------------------------------------------------------
 * GovSync is a Smart India Hackathon 2026 prototype. Every department
 * record below is fictional sample data served from `src/lib/data`.
 * No endpoint listed here exists, and no government system is contacted.
 */

export const SIMULATION = {
  environmentName: "GovSync Simulation Grid",
  environmentCode: "SIM-NIC-01",
  shortLabel: "Simulated environment",
  buildLabel: "SIH 2026 prototype build",
  dataOrigin:
    "All department records, events and metrics on this site are locally generated mock data.",
  notConnected:
    "Not connected to any live government system. No real citizen, business or department data is present or transmitted.",
  frozenAt: `${DEMO_TODAY}, 14:32 IST`,
  timezone: "IST (UTC+05:30)",
  /** Label shown wherever a connector is presented to the applicant. */
  connectionLabel: "Connected (Demo)",
  connectionCaption: "Demo Integration",
  connectionNote: "Simulated Connection",
} as const;

export const departments: Department[] = [
  {
    id: "rev",
    name: "Revenue Department",
    shortName: "Revenue",
    code: "REV",
    authority: "State Revenue Administration",
    systemName: "Revenue Records Core (simulated)",
    baseUrl: "https://sim.revenue.govsync.example/v2",
    apiVersion: "v2.4",
    health: "operational",
    uptimePct: 99.98,
    p95LatencyMs: 412,
    requests24h: 18420,
    successRatePct: 99.7,
    lastHandshakeAt: "27 Sep 2026, 14:31:48",
    authScheme: "OAuth 2.0 client_credentials + mTLS",
    capabilities: [
      "Land parcel lookup",
      "Assessment ledger",
      "Deed verification",
      "Fee collection",
    ],
    services: [
      "Land Verification",
      "Property Assessment",
      "Deed Registration",
      "Tax Receipt Issuance",
    ],
    summary: "Land records, assessment and receipts for the applicant's premises.",
  },
  {
    id: "pol",
    name: "Pollution Control Board",
    shortName: "Pollution Control",
    code: "PCB",
    authority: "State Pollution Control Board",
    systemName: "Consent Management System (simulated)",
    baseUrl: "https://sim.pollution.govsync.example/v1",
    apiVersion: "v1.9",
    health: "degraded",
    uptimePct: 97.42,
    p95LatencyMs: 1870,
    requests24h: 9260,
    successRatePct: 94.2,
    lastHandshakeAt: "27 Sep 2026, 14:30:12",
    authScheme: "OAuth 2.0 client_credentials",
    capabilities: [
      "Consent issuance",
      "Effluent sampling record",
      "Emission zone query",
      "Compliance history",
    ],
    services: [
      "Pollution Consent (CTE/CTO)",
      "Hazardous Waste Authorisation",
      "Compliance Notice Registry",
    ],
    summary: "Environmental consent, sampling records and compliance notices.",
  },
  {
    id: "lab",
    name: "Labour Department",
    shortName: "Labour",
    code: "LAB",
    authority: "State Labour Commissionerate",
    systemName: "Establishment Registry (simulated)",
    baseUrl: "https://sim.labour.govsync.example/v1",
    apiVersion: "v1.6",
    health: "operational",
    uptimePct: 99.9,
    p95LatencyMs: 540,
    requests24h: 7130,
    successRatePct: 99.4,
    lastHandshakeAt: "27 Sep 2026, 14:31:20",
    authScheme: "OAuth 2.0 client_credentials + signed payload",
    capabilities: [
      "Establishment registration",
      "Factory licence workflow",
      "Labour inspection record",
      "Employee muster linkage",
    ],
    services: [
      "Labour Registration",
      "Factory Licence",
      "Trade Licence Endorsement",
      "Inspection Scheduling",
    ],
    summary: "Establishment registration, factory licensing and inspection records.",
  },
  {
    id: "fire",
    name: "Fire Department",
    shortName: "Fire",
    code: "FSD",
    authority: "State Fire Services Directorate",
    systemName: "NOC Clearance Grid (simulated)",
    baseUrl: "https://sim.fire.govsync.example/v1",
    apiVersion: "v1.3",
    health: "operational",
    uptimePct: 99.71,
    p95LatencyMs: 305,
    requests24h: 4980,
    successRatePct: 99.1,
    lastHandshakeAt: "27 Sep 2026, 14:29:55",
    authScheme: "OAuth 2.0 client_credentials + mTLS",
    capabilities: [
      "NOC issuance",
      "Fire audit scheduling",
      "Hydrant and layout validation",
      "Occupancy classification",
    ],
    services: [
      "Fire NOC",
      "Fire Audit Slot Booking",
      "Occupancy Certificate Support",
      "NOC Revocation Notice",
    ],
    summary: "No-objection certificates, egress checks and occupancy classification.",
  },
  {
    id: "mun",
    name: "Municipal Corporation",
    shortName: "Municipal",
    code: "MUN",
    authority: "Urban Local Body",
    systemName: "Building Permission Desk (simulated)",
    baseUrl: "https://sim.municipal.govsync.example/v2",
    apiVersion: "v2.1",
    health: "maintenance",
    uptimePct: 99.2,
    p95LatencyMs: 890,
    requests24h: 6410,
    successRatePct: 96.8,
    lastHandshakeAt: "27 Sep 2026, 13:58:02",
    authScheme: "OAuth 2.0 client_credentials",
    capabilities: [
      "Building permission",
      "Sanctioned plan registry",
      "Property tax receipt",
      "Encumbrance certificate",
    ],
    services: [
      "Building Permission",
      "Sanctioned Plan Registry",
      "Property Tax Receipt",
      "Occupancy Certificate",
    ],
    summary: "Building permission, sanctioned plans, licences and local receipts.",
  },
];

export const departmentById = (id: string): Department | undefined =>
  departments.find((department) => department.id === id);

export const GOVSYNC_NODE_ID = "govsync";

/** Departments shown in the portal navigation, in the order applicants meet them. */
export const connectedDepartmentIds = ["rev", "pol", "lab", "fire"] as const;

export const connectedDepartments: Department[] = connectedDepartmentIds
  .map((id) => departmentById(id))
  .filter((department): department is Department => Boolean(department));

/**
 * The services an applicant can start. Intake itself is out of scope for this
 * phase, so the catalogue is presented as the list a live portal would offer.
 */
export const serviceCatalogue: ServiceCatalogueEntry[] = [
  {
    id: "manufacturing-unit",
    name: "Industrial Permissions",
    description:
      "One application for a manufacturing unit: land verification, pollution consent, fire NOC, labour registration and the consolidated unit permit.",
    departmentIds: ["rev", "pol", "lab", "fire"],
    typicalStages: 6,
    slaTargetDays: 18,
    applicantKinds: ["business"],
  },
  {
    id: "building-permission",
    name: "Building Permission",
    description:
      "Sanction for a new or extended building, coordinated with fire egress clearance and labour capacity endorsement.",
    departmentIds: ["mun", "fire", "lab"],
    typicalStages: 4,
    slaTargetDays: 28,
    applicantKinds: ["business", "citizen"],
  },
  {
    id: "trade-licensing",
    name: "Trade Licensing",
    description:
      "Trade licence for commercial premises, with the fire occupancy pre-check handled inside the same application.",
    departmentIds: ["mun", "fire"],
    typicalStages: 3,
    slaTargetDays: 22,
    applicantKinds: ["business"],
  },
  {
    id: "factory-licence",
    name: "Factory Licence",
    description:
      "Factory licence and establishment registration for an operating industrial unit.",
    departmentIds: ["lab", "fire"],
    typicalStages: 3,
    slaTargetDays: 14,
    applicantKinds: ["business"],
  },
  {
    id: "property-services",
    name: "Property & Revenue Services",
    description:
      "Property tax receipts, encumbrance certificates and other register searches from the revenue department.",
    departmentIds: ["rev"],
    typicalStages: 2,
    slaTargetDays: 7,
    applicantKinds: ["citizen", "business"],
  },
  {
    id: "environmental-clearance",
    name: "Environmental Clearance",
    description:
      "Consent to establish or operate, plus hazardous waste authorisations for industrial premises.",
    departmentIds: ["pol"],
    typicalStages: 3,
    slaTargetDays: 14,
    applicantKinds: ["business"],
  },
];

/** Human label for a department id, including the GovSync platform itself. */
export function departmentLabel(id: string): string {
  if (id === GOVSYNC_NODE_ID) return "GovSync Platform";
  return departmentById(id)?.shortName ?? id;
}

/** Monogram used in place of any departmental emblem. */
export function departmentMark(id: string): string {
  return departmentById(id)?.code ?? "GS";
}

export const architectureLayers: ArchitectureLayer[] = [
  {
    id: "channel",
    index: "01",
    title: "Citizen / Business Channel",
    subtitle: "Single entry surface",
    description:
      "One application, one document set and one tracking reference for the applicant, whether the person is a citizen or a registered business entity.",
    components: [
      {
        name: "Unified Web Portal",
        description: "Government service catalogue, application submission and status tracking.",
      },
      {
        name: "Document Vault",
        description: "Reusable, verified documents shared across departments without re-upload.",
      },
      {
        name: "Notifications",
        description: "Status, clarification and approval notices delivered on the applicant's channel.",
      },
    ],
    protocols: ["HTTPS", "Aadhaar-style e-KYC stub", "Signed upload receipts"],
  },
  {
    id: "gateway",
    index: "02",
    title: "API Gateway",
    subtitle: "Single controlled entry point",
    description:
      "All inbound and outbound traffic is terminated at one gateway that applies quotas, schema validation and routing policy.",
    components: [
      {
        name: "Ingress Policy Engine",
        description: "Rate limits, IP allow-listing per department and payload size policy.",
      },
      {
        name: "Protocol Adapters",
        description: "REST, SOAP and event-bus translation to a canonical message envelope.",
      },
      {
        name: "Canonical Envelope",
        description: "Correlation id, schema version, timestamp and payload hash on every message.",
      },
      {
        name: "Quota & Throttle",
        description: "Per-tenant request budgets with burst protection.",
      },
    ],
    protocols: ["REST / JSON", "gRPC", "Kafka topic bridge", "mTLS"],
  },
  {
    id: "iam",
    index: "03",
    title: "Authentication & Authorization",
    subtitle: "Identity and access management",
    description:
      "Identity is federated. Applicants are verified once, and departmental officers act under scoped, time-bound roles.",
    components: [
      {
        name: "Applicant Identity",
        description: "Citizen and business identity with verified credential level and consent ledger.",
      },
      {
        name: "Officer Identity",
        description: "Departmental officers authenticate through their own registrar in the target deployment.",
      },
      {
        name: "Consent & Delegation",
        description: "Explicit, revocable consent before a department reads applicant-held records.",
      },
      {
        name: "Role & Scope Engine",
        description: "Least-privilege scopes per department, per workflow stage, per record.",
      },
    ],
    protocols: ["OAuth 2.0 / OIDC", "PKI + mTLS", "Token introspection"],
  },
  {
    id: "orchestration",
    index: "04",
    title: "Workflow Orchestration",
    subtitle: "Unified approval engine",
    description:
      "The orchestration engine turns one submitted application into a governed sequence of departmental approvals, with dependencies, SLAs and escalation.",
    components: [
      {
        name: "Process Definition",
        description: "Versioned workflow templates per service, e.g. Manufacturing Unit Approval.",
      },
      {
        name: "Dependency Resolver",
        description: "Blocks downstream stages until upstream artefacts are published.",
      },
      {
        name: "SLA & Escalation",
        description: "Per-stage clocks, escalation ladders and departmental escalation contacts.",
      },
      {
        name: "Decision Journal",
        description: "Every state transition is recorded with actor, reason and evidence reference.",
      },
    ],
    protocols: ["BPMN-style state machines", "Idempotent task queue"],
  },
  {
    id: "interop",
    index: "05",
    title: "Interoperability Layer",
    subtitle: "Data validation and normalisation",
    description:
      "Department-specific payloads are mapped onto shared canonical schemas so no department has to understand another's internal format.",
    components: [
      {
        name: "Schema Registry",
        description: "Versioned canonical entities: party, parcel, establishment, consent, clearance.",
      },
      {
        name: "Data Validation",
        description: "Field-level, cross-field and cross-department consistency rules before dispatch.",
      },
      {
        name: "Entity Resolution",
        description: "Confirms that the same establishment or parcel is the same record in every system.",
      },
      {
        name: "Mapping Library",
        description: "Per-department adapter definitions, versioned and independently deployable.",
      },
    ],
    protocols: ["JSON Schema", "XSD / SOAP bridging", "Canonical data model"],
  },
  {
    id: "services",
    index: "06",
    title: "Platform Services",
    subtitle: "Cross-cutting government infrastructure",
    description:
      "Shared services that every workflow depends on: immutable audit trail, notifications and reusable document custody.",
    components: [
      {
        name: "Audit Logs",
        description: "Append-only, hash-chained record of reads, writes and approvals.",
      },
      {
        name: "Notification Service",
        description: "Portal, email and SMS dispatch with delivery receipts and escalation triggers.",
      },
      {
        name: "Document Custody",
        description: "Verified artefact storage with department-level access control and retention policy.",
      },
      {
        name: "Observability",
        description: "Health, latency and failure telemetry for every connector and stage.",
      },
    ],
    protocols: ["Hash-chained ledger", "Signed PDF/A", "OpenTelemetry"],
  },
  {
    id: "connectors",
    index: "07",
    title: "Department Connectors",
    subtitle: "Simulated department APIs",
    description:
      "Connector per department, each speaking that department's native protocol and translating into the canonical envelope.",
    components: [
      {
        name: "Revenue Connector",
        description: "Land parcel and assessment ledger lookups, deed verification, fee receipts.",
      },
      {
        name: "Pollution Control Connector",
        description: "Consent records, sampling results and compliance notices.",
      },
      {
        name: "Labour Connector",
        description: "Establishment registration, factory licence workflow, inspection records.",
      },
      {
        name: "Fire Services Connector",
        description: "NOC issuance, audit slot booking and occupancy classification.",
      },
      {
        name: "Municipal Connector",
        description: "Building permission, sanctioned plans and property tax receipts.",
      },
    ],
    protocols: ["Simulated REST endpoints", "Simulated event streams", "Retry + dead-letter"],
  },
];
