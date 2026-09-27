import type {
  ApplicantKind,
  Application,
  ApplicationDocument,
  Approval,
  DepartmentTrack,
  RequiredDocument,
} from "@/lib/types";
import { daysBetween } from "@/lib/format";

/**
 * SIMULATED APPLICATIONS.
 * Fictional sample records used to demonstrate the unified workflow UI.
 * The whole record set is frozen on DEMO_TODAY (27 Sep 2026).
 */

const BIZ = {
  applicantKind: "business",
  applicantName: "Sundara Precision Castings Pvt. Ltd.",
  entityType: "Private Limited Company",
  identifierMasked: "UIN ••••-••••-4471",
  contactMasked: "+91 •••••• ••418",
} satisfies Partial<Application>;

const CITIZEN = {
  applicantKind: "citizen",
  applicantName: "Lakshmi Narayanan",
  entityType: "Individual (linked citizen profile)",
  identifierMasked: "Aadhaar •••• •••• 4812",
  contactMasked: "+91 •••••• ••072",
} satisfies Partial<Application>;

const TRADING = {
  applicantKind: "business",
  applicantName: "Nandur Coastal Restaurants Pvt. Ltd.",
  entityType: "Private Limited Company",
  identifierMasked: "UIN ••••-••••-2093",
  contactMasked: "+91 •••••• ••561",
} satisfies Partial<Application>;

const DEVELOPER = {
  applicantKind: "business",
  applicantName: "Nandur Buildwell Developers LLP",
  entityType: "Limited Liability Partnership",
  identifierMasked: "UIN ••••-••••-7730",
  contactMasked: "+91 •••••• ••904",
} satisfies Partial<Application>;

const manufacturingUnit: Application = {
  id: "GS-2026-00142",
  title: "Manufacturing Unit Approval",
  service: "Industrial Permissions",
  ...BIZ,
  district: "Nandur Industrial Belt",
  filedVia: "GovSync Unified Portal",
  submittedAt: "18 Sep 2026, 09:24",
  lastUpdated: "27 Sep 2026, 10:42",
  state: "under-review",
  priority: "expedited",
  dueAt: "06 Oct 2026",
  slaTargetDays: 18,
  elapsedDays: 9,
  summary:
    "One application covering land verification, pollution consent, fire NOC, labour registration and the consolidated unit permit for a new precision casting unit.",
  tracks: [
    {
      departmentId: "rev",
      state: "approved",
      approvalId: "gs142-land",
      lastUpdated: "26 Sep 2026, 16:18",
      dependsOn: ["gs142-submitted"],
      documents: [
        {
          name: "Registered sale deed (copy)",
          mandatory: true,
          owedBy: "applicant",
          state: "received",
          receivedAt: "18 Sep 2026, 09:31",
        },
        {
          name: "7/12 land extract",
          mandatory: true,
          owedBy: "applicant",
          state: "received",
          receivedAt: "18 Sep 2026, 09:33",
        },
        {
          name: "Site plan with built-up area",
          mandatory: true,
          owedBy: "applicant",
          state: "received",
          receivedAt: "18 Sep 2026, 11:02",
        },
        {
          name: "Property tax assessment receipt",
          mandatory: true,
          owedBy: "applicant",
          state: "received",
          receivedAt: "18 Sep 2026, 11:15",
        },
      ],
      officer: "Asst. Commissioner, Revenue",
      slaTargetDays: 5,
      remark:
        "Parcel 118/B verified. No encumbrance registered. Land use compatible with manufacturing.",
    },
    {
      departmentId: "pol",
      state: "under-review",
      approvalId: "gs142-pollution",
      lastUpdated: "27 Sep 2026, 10:42",
      dependsOn: ["gs142-land"],
      documents: [
        {
          name: "Consent to Establish application",
          mandatory: true,
          owedBy: "applicant",
          state: "received",
          receivedAt: "26 Sep 2026, 16:20",
        },
        {
          name: "Effluent analysis report (3rd party)",
          mandatory: true,
          owedBy: "applicant",
          state: "received",
          receivedAt: "22 Sep 2026, 14:08",
        },
        {
          name: "Revised site plan showing the inspection access",
          mandatory: true,
          owedBy: "applicant",
          state: "pending",
          note: "Requested by the board on 27 Sep 2026. Demo deadline 30 Sep 2026.",
        },
      ],
      officer: "Sr. Environmental Officer, State PCB",
      slaTargetDays: 10,
      remark:
        "Effluent analysis accepted. The board needs one revised drawing before the inspection can be scheduled.",
    },
    {
      departmentId: "fire",
      state: "pending",
      approvalId: "gs142-fire",
      lastUpdated: "26 Sep 2026, 16:22",
      dependsOn: ["gs142-pollution"],
      documents: [
        {
          name: "Fire layout drawing (signed)",
          mandatory: true,
          owedBy: "applicant",
          state: "received",
          receivedAt: "20 Sep 2026, 10:12",
        },
        {
          name: "Fire fighting equipment schedule",
          mandatory: true,
          owedBy: "applicant",
          state: "received",
          receivedAt: "22 Sep 2026, 09:45",
        },
        {
          name: "Pollution consent reference",
          mandatory: true,
          owedBy: "department",
          state: "pending",
          note: "Issued automatically to the Fire Department once pollution approval completes.",
        },
      ],
      officer: "Divisional Officer, Fire Services",
      slaTargetDays: 12,
      remark:
        "Layout pre-check passed. NOC issuance opens when the pollution consent reference is published.",
    },
    {
      departmentId: "lab",
      state: "pending",
      approvalId: "gs142-labour",
      lastUpdated: "20 Sep 2026, 12:04",
      dependsOn: ["gs142-fire"],
      documents: [
        {
          name: "Memorandum and articles of association",
          mandatory: true,
          owedBy: "applicant",
          state: "received",
          receivedAt: "18 Sep 2026, 09:36",
        },
        {
          name: "Factory plan with machinery list",
          mandatory: true,
          owedBy: "applicant",
          state: "received",
          receivedAt: "19 Sep 2026, 10:20",
        },
        {
          name: "Fire NOC reference number",
          mandatory: true,
          owedBy: "platform",
          state: "pending",
          note: "Forwarded by GovSync when the fire NOC is issued.",
        },
      ],
      officer: "Registration Cell, Labour Dept.",
      slaTargetDays: 8,
      remark:
        "Queued. Registration cannot begin until the fire NOC reference is published to this application.",
    },
  ],
  approvals: [
    {
      id: "gs142-submitted",
      order: 1,
      title: "Application Submitted",
      departmentId: "govsync",
      state: "approved",
      completion: 100,
      description:
        "Applicant submits one consolidated form with a single reusable document set. GovSync validates the payload and locks the application version.",
      startedAt: "18 Sep 2026, 09:24",
      completedAt: "18 Sep 2026, 09:24",
      actor: "Applicant portal",
      slaDays: 0,
      dependsOn: [],
      outputArtifacts: ["application.form.v1", "document.set.v1"],
      remark: "Reference GS-2026-00142 issued. Document set checksum recorded.",
    },
    {
      id: "gs142-land",
      order: 2,
      title: "Land Verification",
      departmentId: "rev",
      state: "approved",
      completion: 100,
      description:
        "Revenue department verifies parcel ownership, land use classification and registered encumbrance, then returns a verified parcel record to the interoperability layer.",
      startedAt: "18 Sep 2026, 09:25",
      completedAt: "26 Sep 2026, 16:18",
      actor: "Revenue Department",
      slaDays: 8,
      dependsOn: ["gs142-submitted"],
      outputArtifacts: ["parcel.verified.v1", "encumbrance.clear.v1"],
      remark: "Parcel 118/B clear. Encumbrance search returned no registered charge.",
    },
    {
      id: "gs142-pollution",
      order: 3,
      title: "Pollution Approval",
      departmentId: "pol",
      state: "under-review",
      completion: 72,
      description:
        "Consent to Establish is raised automatically from the verified land record. The board verifies the effluent analysis report and schedules an inspection.",
      startedAt: "26 Sep 2026, 16:19",
      actor: "Pollution Control Board",
      slaDays: 10,
      dependsOn: ["gs142-land"],
      outputArtifacts: ["consent.application.v1", "effluent.report.v1"],
      action: {
        item: "Upload revised site plan",
        departmentId: "pol",
        requestedAt: "27 Sep 2026, 10:42",
        deadline: "30 Sep 2026",
        note: "The board needs the inspection access marked on the drawing set.",
      },
      remark:
        "Consent reference PCB/CTE/2026/0418 created. Sample verification complete, inspection scheduling pending the revised drawing.",
    },
    {
      id: "gs142-fire",
      order: 4,
      title: "Fire NOC",
      departmentId: "fire",
      state: "pending",
      completion: 34,
      description:
        "Fire services validate the building layout, equipment schedule and occupancy classification, then issue the no-objection certificate.",
      startedAt: "20 Sep 2026, 10:13",
      actor: "Fire Department",
      slaDays: 12,
      dependsOn: ["gs142-pollution"],
      outputArtifacts: ["noc.request.v1", "layout.validated.v1"],
      remark:
        "Layout pre-check passed. The NOC case opens as soon as the pollution consent reference is published.",
    },
    {
      id: "gs142-labour",
      order: 5,
      title: "Labour Registration",
      departmentId: "lab",
      state: "pending",
      completion: 33,
      description:
        "Establishment registration and factory licence filing, created from the same applicant and site records already verified by earlier departments.",
      startedAt: "20 Sep 2026, 12:04",
      actor: "Labour Department",
      slaDays: 8,
      dependsOn: ["gs142-fire"],
      outputArtifacts: ["establishment.reg.v1", "factory.licence.app.v1"],
      remark: "Held behind the fire NOC stage by workflow policy.",
    },
    {
      id: "gs142-final",
      order: 6,
      title: "Final Approval",
      departmentId: "rev",
      state: "pending",
      completion: 33,
      description:
        "District office consolidates all departmental clearances into a single unit permit and publishes the approval record to the applicant's vault.",
      startedAt: "20 Sep 2026, 12:06",
      actor: "District Collector Office",
      slaDays: 7,
      dependsOn: ["gs142-pollution", "gs142-fire", "gs142-labour"],
      outputArtifacts: ["unit.permit.v1", "clearance.bundle.v1"],
      remark: "Opens only when all three upstream clearances are published.",
    },
  ],
  documents: [
    {
      id: "DOC-4471-A",
      name: "Sale deed copy",
      category: "Land record",
      uploadedAt: "18 Sep 2026, 09:31",
      sizeKb: 1840,
      status: "verified",
      verifiedBy: "Revenue Department",
      origin: "Applicant upload",
    },
    {
      id: "DOC-4471-B",
      name: "7/12 land extract",
      category: "Land record",
      uploadedAt: "18 Sep 2026, 09:33",
      sizeKb: 620,
      status: "verified",
      verifiedBy: "Revenue Department",
      origin: "Applicant upload",
    },
    {
      id: "DOC-4471-C",
      name: "Site plan with built-up area",
      category: "Site plan",
      uploadedAt: "18 Sep 2026, 11:02",
      sizeKb: 3120,
      status: "rejected",
      verifiedBy: "Pollution Control Board",
      origin: "Applicant upload",
    },
    {
      id: "DOC-4471-D",
      name: "Effluent analysis report",
      category: "Environmental",
      uploadedAt: "22 Sep 2026, 14:08",
      sizeKb: 2240,
      status: "verified",
      verifiedBy: "Pollution Control Board",
      origin: "Applicant upload",
    },
    {
      id: "DOC-4471-E",
      name: "Fire layout drawing",
      category: "Fire safety",
      uploadedAt: "20 Sep 2026, 10:12",
      sizeKb: 4780,
      status: "awaiting-review",
      verifiedBy: "Fire Department",
      origin: "Applicant upload",
    },
    {
      id: "DOC-4471-F",
      name: "Memorandum of association",
      category: "Entity record",
      uploadedAt: "18 Sep 2026, 09:36",
      sizeKb: 980,
      status: "verified",
      verifiedBy: "Labour Department",
      origin: "Applicant upload",
    },
    {
      id: "DOC-4471-G",
      name: "Consent to Establish reference",
      category: "Environmental",
      uploadedAt: "26 Sep 2026, 16:20",
      sizeKb: 410,
      status: "awaiting-review",
      verifiedBy: "Pollution Control Board",
      origin: "GovSync auto-generated",
    },
  ],
  activities: [
    {
      id: "AC-142-09",
      at: "27 Sep 2026, 10:42",
      actor: "Pollution Control Board",
      actorRole: "Department",
      action: "Application moved to Under Review",
      detail:
        "Consent reference PCB/CTE/2026/0418 opened for verification. A revised site plan has been requested before the inspection slot is booked.",
    },
    {
      id: "AC-142-08",
      at: "27 Sep 2026, 09:16",
      actor: "GovSync",
      actorRole: "Platform",
      action: "Action request raised",
      detail:
        "Applicant notified on portal and SMS that the board is waiting on one drawing.",
    },
    {
      id: "AC-142-07",
      at: "26 Sep 2026, 16:18",
      actor: "Revenue Department",
      actorRole: "Department",
      action: "Land verification approved",
      detail:
        "Parcel 118/B verified, no encumbrance registered. Artefact published: parcel.verified.v1.",
    },
    {
      id: "AC-142-06",
      at: "26 Sep 2026, 16:22",
      actor: "GovSync",
      actorRole: "Platform",
      action: "Data forwarded",
      detail:
        "Verified parcel record forwarded to the pollution consent register. Fire and labour stages re-evaluated against the new artefact.",
    },
    {
      id: "AC-142-05",
      at: "22 Sep 2026, 14:08",
      actor: "Applicant",
      actorRole: "Business entity",
      action: "Document added",
      detail:
        "Third-party effluent analysis report uploaded once and shared with every department on the workflow.",
    },
    {
      id: "AC-142-04",
      at: "20 Sep 2026, 10:13",
      actor: "Fire Department",
      actorRole: "Department",
      action: "Layout pre-check passed",
      detail:
        "Egress width and equipment schedule compliant for occupancy class II. NOC case held for the consent reference.",
    },
    {
      id: "AC-142-03",
      at: "18 Sep 2026, 16:40",
      actor: "Pollution Control Board",
      actorRole: "Department",
      action: "Document clarification",
      detail:
        "The site plan did not mark the inspection access, so a revised drawing was requested rather than a new application.",
    },
    {
      id: "AC-142-02",
      at: "18 Sep 2026, 09:25",
      actor: "GovSync",
      actorRole: "Platform",
      action: "Workflow instantiated",
      detail:
        "Template MANUFACTURING-V3 started with 6 stages. Four departments notified, consent recorded for each reader.",
    },
    {
      id: "AC-142-01",
      at: "18 Sep 2026, 09:24",
      actor: "GovSync",
      actorRole: "Platform",
      action: "Application submitted successfully",
      detail:
        "Form and 6 documents validated against the canonical schema. Application version 1 locked.",
    },
  ],
};

const restaurantLicence: Application = {
  id: "GS-2026-00137",
  title: "Restaurant Trade License",
  service: "Trade Licensing",
  ...TRADING,
  district: "Nandur Beach Ward",
  filedVia: "GovSync Unified Portal",
  submittedAt: "24 Sep 2026, 11:05",
  lastUpdated: "26 Sep 2026, 11:20",
  state: "action-required",
  priority: "standard",
  dueAt: "16 Oct 2026",
  slaTargetDays: 22,
  elapsedDays: 3,
  summary:
    "First trade licence for a 64-seater restaurant, coordinated across the municipal licensing desk and the fire department's occupancy pre-check.",
  tracks: [
    {
      departmentId: "mun",
      state: "action-required",
      approvalId: "gs137-licence",
      lastUpdated: "26 Sep 2026, 10:05",
      dependsOn: ["gs137-submitted"],
      documents: [
        {
          name: "Premises rent agreement",
          mandatory: true,
          owedBy: "applicant",
          state: "received",
          receivedAt: "24 Sep 2026, 11:12",
        },
        {
          name: "List of menu items with non-veg declaration",
          mandatory: true,
          owedBy: "applicant",
          state: "received",
          receivedAt: "24 Sep 2026, 11:18",
        },
        {
          name: "Kitchen exhaust plan",
          mandatory: true,
          owedBy: "applicant",
          state: "pending",
          note: "Requested by the fire department on 26 Sep 2026.",
        },
      ],
      officer: "Licensing Section, Municipal Corporation",
      slaTargetDays: 12,
      remark:
        "Licence fee received. Issuance waits on the fire occupancy pre-check, which is waiting on a drawing from the applicant.",
    },
    {
      departmentId: "fire",
      state: "action-required",
      approvalId: "gs137-fire",
      lastUpdated: "26 Sep 2026, 11:20",
      dependsOn: ["gs137-submitted"],
      documents: [
        {
          name: "Building layout drawing",
          mandatory: true,
          owedBy: "applicant",
          state: "pending",
          note: "Applicant must provide the building layout so egress can be measured.",
        },
        {
          name: "Fire equipment invoice",
          mandatory: false,
          owedBy: "applicant",
          state: "received",
          receivedAt: "24 Sep 2026, 11:25",
        },
      ],
      officer: "Station Officer, Nandur Fire Station",
      slaTargetDays: 7,
      remark:
        "Occupancy class cannot be assigned without a scaled layout, so the pre-check cannot start.",
    },
  ],
  approvals: [
    {
      id: "gs137-submitted",
      order: 1,
      title: "Application Submitted",
      departmentId: "govsync",
      state: "approved",
      completion: 100,
      description:
        "One form for the municipal licence and the fire occupancy pre-check, with the premises record reused from the applicant's vault.",
      startedAt: "24 Sep 2026, 11:05",
      completedAt: "24 Sep 2026, 11:05",
      actor: "Applicant portal",
      slaDays: 0,
      dependsOn: [],
      outputArtifacts: ["application.form.v1", "premises.record.v1"],
      remark: "Reference GS-2026-00137 issued. Licence fee receipt recorded.",
    },
    {
      id: "gs137-licence",
      order: 2,
      title: "Trade Licence Review",
      departmentId: "mun",
      state: "action-required",
      completion: 62,
      description:
        "The licensing desk verifies the premises, fee and activity classification, then issues the trade licence.",
      startedAt: "24 Sep 2026, 11:06",
      actor: "Municipal Corporation",
      slaDays: 12,
      dependsOn: ["gs137-submitted"],
      outputArtifacts: ["licence.application.v1", "fee.receipt.v1"],
      remark:
        "Classification accepted for a 64-seater restaurant. The licence is drafted but cannot be issued until the fire pre-check closes.",
    },
    {
      id: "gs137-fire",
      order: 3,
      title: "Fire Occupancy Pre-check",
      departmentId: "fire",
      state: "action-required",
      completion: 18,
      description:
        "Fire services confirm the number of exits, exit widths and kitchen separation for the proposed occupancy class.",
      startedAt: "24 Sep 2026, 11:07",
      actor: "Fire Department",
      slaDays: 7,
      dependsOn: ["gs137-submitted"],
      outputArtifacts: ["occupancy.request.v1"],
      action: {
        item: "Provide building layout",
        departmentId: "fire",
        requestedAt: "26 Sep 2026, 11:20",
        deadline: "29 Sep 2026",
        note: "A scaled drawing is enough. Photo evidence cannot be measured against a code threshold.",
      },
      remark: "Held on the applicant. No other document is outstanding on this stage.",
    },
  ],
  documents: [
    {
      id: "DOC-2210-A",
      name: "Premises rent agreement",
      category: "Licence",
      uploadedAt: "24 Sep 2026, 11:12",
      sizeKb: 540,
      status: "verified",
      verifiedBy: "Municipal Corporation",
      origin: "Applicant upload",
    },
    {
      id: "DOC-2210-B",
      name: "Menu list with non-veg declaration",
      category: "Licence",
      uploadedAt: "24 Sep 2026, 11:18",
      sizeKb: 260,
      status: "verified",
      verifiedBy: "Municipal Corporation",
      origin: "Applicant upload",
    },
    {
      id: "DOC-2210-C",
      name: "Fire equipment invoice",
      category: "Fire safety",
      uploadedAt: "24 Sep 2026, 11:25",
      sizeKb: 380,
      status: "awaiting-review",
      verifiedBy: "Fire Department",
      origin: "Applicant upload",
    },
  ],
  activities: [
    {
      id: "AC-137-04",
      at: "26 Sep 2026, 11:20",
      actor: "Fire Department",
      actorRole: "Department",
      action: "Building layout requested",
      detail:
        "Occupancy class cannot be assigned without a scaled layout, so the pre-check cannot start. Deadline set at 29 Sep 2026.",
    },
    {
      id: "AC-137-03",
      at: "26 Sep 2026, 10:05",
      actor: "Municipal Corporation",
      actorRole: "Department",
      action: "Licence classification accepted",
      detail:
        "Activity classified as a 64-seater restaurant. Draft licence held pending the fire pre-check.",
    },
    {
      id: "AC-137-02",
      at: "24 Sep 2026, 11:07",
      actor: "Fire Department",
      actorRole: "Department",
      action: "Occupancy pre-check opened",
      detail: "Case created from the same premises record the licensing desk is using.",
    },
    {
      id: "AC-137-01",
      at: "24 Sep 2026, 11:05",
      actor: "GovSync",
      actorRole: "Platform",
      action: "Application submitted successfully",
      detail: "3 documents validated. Licence fee receipt linked to the application.",
    },
  ],
};

const commercialBuilding: Application = {
  id: "GS-2026-00129",
  title: "Commercial Building Approval",
  service: "Building Permission",
  ...DEVELOPER,
  district: "Nandur Central Ward",
  filedVia: "GovSync Unified Portal",
  submittedAt: "21 Sep 2026, 15:48",
  lastUpdated: "25 Sep 2026, 15:05",
  state: "in-progress",
  priority: "standard",
  dueAt: "19 Oct 2026",
  slaTargetDays: 28,
  elapsedDays: 6,
  summary:
    "Commercial ground and first floor of 2,400 m² in the central ward, coordinated across municipal building permission, fire egress and labour shift capacity.",
  tracks: [
    {
      departmentId: "mun",
      state: "under-review",
      approvalId: "gs129-permission",
      lastUpdated: "25 Sep 2026, 15:05",
      dependsOn: ["gs129-submitted"],
      documents: [
        {
          name: "Sanctioned plan drawing set",
          mandatory: true,
          owedBy: "applicant",
          state: "received",
          receivedAt: "21 Sep 2026, 16:04",
        },
        {
          name: "Structural safety certificate",
          mandatory: true,
          owedBy: "applicant",
          state: "received",
          receivedAt: "22 Sep 2026, 12:30",
        },
        {
          name: "Scaled layout with exit widths",
          mandatory: true,
          owedBy: "applicant",
          state: "received",
          receivedAt: "23 Sep 2026, 09:50",
        },
      ],
      officer: "Building Permission Desk, Municipal Corporation",
      slaTargetDays: 14,
      remark: "Setback compliance confirmed. Floor-area ratio check is still open.",
    },
    {
      departmentId: "fire",
      state: "pending",
      approvalId: "gs129-fire",
      lastUpdated: "23 Sep 2026, 09:52",
      dependsOn: ["gs129-permission"],
      documents: [
        {
          name: "Updated access and egress plan",
          mandatory: true,
          owedBy: "applicant",
          state: "received",
          receivedAt: "23 Sep 2026, 09:52",
        },
      ],
      officer: "Asst. Divisional Officer, Fire Services",
      slaTargetDays: 10,
      remark: "Queued behind the municipal sanction, which identifies the final exit widths.",
    },
    {
      departmentId: "lab",
      state: "pending",
      approvalId: "gs129-labour",
      lastUpdated: "21 Sep 2026, 15:55",
      dependsOn: ["gs129-fire"],
      documents: [
        {
          name: "Machinery and shift plan",
          mandatory: true,
          owedBy: "applicant",
          state: "received",
          receivedAt: "21 Sep 2026, 15:55",
        },
      ],
      officer: "Factory Inspector Grade II, Labour Dept.",
      slaTargetDays: 9,
      remark: "Queued behind the fire egress clearance.",
    },
  ],
  approvals: [
    {
      id: "gs129-submitted",
      order: 1,
      title: "Application Submitted",
      departmentId: "govsync",
      state: "approved",
      completion: 100,
      description:
        "Building permission proposal submitted against the applicant's verified entity and land record.",
      startedAt: "21 Sep 2026, 15:48",
      completedAt: "21 Sep 2026, 15:49",
      actor: "Applicant portal",
      slaDays: 0,
      dependsOn: [],
      outputArtifacts: ["application.form.v1", "parcel.verified.v1"],
      remark: "Reused the verified parcel record, so no land re-verification was needed.",
    },
    {
      id: "gs129-permission",
      order: 2,
      title: "Building Plan Review",
      departmentId: "mun",
      state: "under-review",
      completion: 68,
      description:
        "Municipal building permission desk validates the plan set against the sanctioned layout, setbacks and floor-area ratio.",
      startedAt: "21 Sep 2026, 15:50",
      actor: "Municipal Corporation",
      slaDays: 14,
      dependsOn: ["gs129-submitted"],
      outputArtifacts: ["permission.review.v1", "plan.set.v1"],
      remark: "Setback compliance confirmed. Floor-area ratio check still open with the town planning section.",
    },
    {
      id: "gs129-fire",
      order: 3,
      title: "Fire NOC Clearance",
      departmentId: "fire",
      state: "pending",
      completion: 22,
      description:
        "Fire services confirm access and egress adequacy for the proposed commercial occupancy.",
      startedAt: "23 Sep 2026, 09:52",
      actor: "Fire Department",
      slaDays: 10,
      dependsOn: ["gs129-permission"],
      outputArtifacts: ["egress.clearance.v1"],
      remark: "Held until the municipal sanction identifies the revised exit widths.",
    },
    {
      id: "gs129-labour",
      order: 4,
      title: "Labour Capacity Endorsement",
      departmentId: "lab",
      state: "pending",
      completion: 15,
      description:
        "Labour department endorses the added shift capacity against the establishment registration.",
      startedAt: "21 Sep 2026, 15:55",
      actor: "Labour Department",
      slaDays: 9,
      dependsOn: ["gs129-fire"],
      outputArtifacts: ["establishment.amendment.v1"],
      remark: "Held behind the fire egress clearance.",
    },
  ],
  documents: [
    {
      id: "DOC-9901-A",
      name: "Sanctioned plan drawing set",
      category: "Building plan",
      uploadedAt: "21 Sep 2026, 16:04",
      sizeKb: 8420,
      status: "awaiting-review",
      verifiedBy: "Municipal Corporation",
      origin: "Applicant upload",
    },
    {
      id: "DOC-9901-B",
      name: "Structural safety certificate",
      category: "Structural",
      uploadedAt: "22 Sep 2026, 12:30",
      sizeKb: 1260,
      status: "verified",
      verifiedBy: "Municipal Corporation",
      origin: "Applicant upload",
    },
    {
      id: "DOC-9901-C",
      name: "Access and egress plan",
      category: "Fire safety",
      uploadedAt: "23 Sep 2026, 09:52",
      sizeKb: 3120,
      status: "awaiting-review",
      verifiedBy: "Fire Department",
      origin: "Applicant upload",
    },
  ],
  activities: [
    {
      id: "AC-129-04",
      at: "25 Sep 2026, 15:05",
      actor: "Municipal Corporation",
      actorRole: "Department",
      action: "Plan set under review",
      detail: "Setback compliance confirmed. Floor-area ratio check remains open.",
    },
    {
      id: "AC-129-03",
      at: "23 Sep 2026, 09:52",
      actor: "Fire Department",
      actorRole: "Department",
      action: "Egress review opened",
      detail: "Case opened on receipt of the scaled access and egress plan.",
    },
    {
      id: "AC-129-02",
      at: "22 Sep 2026, 12:30",
      actor: "Applicant",
      actorRole: "Business entity",
      action: "Document added",
      detail: "Structural safety certificate uploaded once and shared with all three departments.",
    },
    {
      id: "AC-129-01",
      at: "21 Sep 2026, 15:48",
      actor: "GovSync",
      actorRole: "Platform",
      action: "Application submitted successfully",
      detail: "4 stages started, verified parcel record reused from an earlier application.",
    },
  ],
};

/**
 * Compact seed for the closed applications in the archive. The factory fills
 * in the per-department tracks, the closure record and the SLA position so
 * the eight finished cases do not repeat the same shape eight times.
 */
interface ArchivedSeed {
  id: string;
  title: string;
  service: string;
  profile: Partial<Application> & { applicantKind: ApplicantKind };
  district: string;
  summary: string;
  submittedAt: string;
  closedAt: string;
  dueAt: string;
  slaTargetDays: number;
  artefact: string;
  stages: {
    id: string;
    title: string;
    departmentId: string;
    officer: string;
    completedAt: string;
    slaDays: number;
    artefacts: string[];
    document: string;
    category: string;
    sizeKb: number;
    uploadedAt: string;
  }[];
}

const archivedSeeds: ArchivedSeed[] = [
  {
    id: "GS-2026-00064",
    title: "Property Tax Payment & Receipt",
    service: "Revenue Services",
    profile: CITIZEN,
    district: "Nandur",
    summary:
      "Outstanding property tax of INR 18,400 for the Nandur ward premises, paid through the unified platform.",
    submittedAt: "02 Sep 2026, 09:15",
    closedAt: "03 Sep 2026, 11:02",
    dueAt: "09 Sep 2026",
    slaTargetDays: 7,
    artefact: "Receipt REV/ND/2026/3318",
    stages: [
      {
        id: "gs64-demand",
        title: "Demand Confirmation",
        departmentId: "rev",
        officer: "Ward Revenue Office, Nandur",
        completedAt: "02 Sep 2026, 14:30",
        slaDays: 2,
        artefacts: ["demand.notice.v1"],
        document: "Previous year receipt",
        category: "Revenue record",
        sizeKb: 220,
        uploadedAt: "02 Sep 2026, 09:21",
      },
      {
        id: "gs64-receipt",
        title: "Payment Receipt Issued",
        departmentId: "rev",
        officer: "Ward Revenue Office, Nandur",
        completedAt: "03 Sep 2026, 11:02",
        slaDays: 2,
        artefacts: ["receipt.v1"],
        document: "Property tax challan",
        category: "Revenue record",
        sizeKb: 180,
        uploadedAt: "02 Sep 2026, 09:24",
      },
    ],
  },
  {
    id: "GS-2026-00072",
    title: "Factory Licence Renewal",
    service: "Labour Services",
    profile: BIZ,
    district: "Nandur Industrial Belt",
    summary:
      "Renewal of the factory licence for the existing casting unit, filed against the establishment registration already on record.",
    submittedAt: "05 Sep 2026, 11:40",
    closedAt: "11 Sep 2026, 16:20",
    dueAt: "19 Sep 2026",
    slaTargetDays: 14,
    artefact: "Factory licence FL/ND/2026/0884",
    stages: [
      {
        id: "gs72-documents",
        title: "Document Verification",
        departmentId: "lab",
        officer: "Registration Cell, Labour Dept.",
        completedAt: "07 Sep 2026, 12:05",
        slaDays: 2,
        artefacts: ["factory.licence.app.v1"],
        document: "Machinery list",
        category: "Factory record",
        sizeKb: 640,
        uploadedAt: "05 Sep 2026, 11:48",
      },
      {
        id: "gs72-licence",
        title: "Factory Licence Issued",
        departmentId: "lab",
        officer: "Asst. Labour Commissioner",
        completedAt: "11 Sep 2026, 16:20",
        slaDays: 9,
        artefacts: ["factory.licence.v1"],
        document: "Prior year licence copy",
        category: "Licence",
        sizeKb: 520,
        uploadedAt: "05 Sep 2026, 11:52",
      },
    ],
  },
  {
    id: "GS-2026-00081",
    title: "Fire NOC Renewal",
    service: "Fire Safety",
    profile: BIZ,
    district: "Nandur Industrial Belt",
    summary:
      "Annual renewal of the fire no-objection certificate for the existing premises, cleared on file review without a fresh site visit.",
    submittedAt: "01 Sep 2026, 14:05",
    closedAt: "04 Sep 2026, 12:15",
    dueAt: "15 Sep 2026",
    slaTargetDays: 14,
    artefact: "NOC FS/2026/0442",
    stages: [
      {
        id: "gs81-precheck",
        title: "Equipment Document Check",
        departmentId: "fire",
        officer: "Divisional Officer, Fire Services",
        completedAt: "02 Sep 2026, 10:45",
        slaDays: 2,
        artefacts: ["layout.validated.v1"],
        document: "Equipment test certificates",
        category: "Fire safety",
        sizeKb: 760,
        uploadedAt: "01 Sep 2026, 14:12",
      },
      {
        id: "gs81-noc",
        title: "NOC Issued",
        departmentId: "fire",
        officer: "Divisional Officer, Fire Services",
        completedAt: "04 Sep 2026, 12:15",
        slaDays: 6,
        artefacts: ["noc.v1"],
        document: "Existing NOC copy",
        category: "Fire safety",
        sizeKb: 410,
        uploadedAt: "01 Sep 2026, 14:20",
      },
    ],
  },
  {
    id: "GS-2026-00088",
    title: "Consent to Operate",
    service: "Environmental Clearance",
    profile: BIZ,
    district: "Nandur Industrial Belt",
    summary:
      "Consent to Operate for the commissioned casting unit, granted on the effluent record already verified during establishment.",
    submittedAt: "08 Sep 2026, 10:30",
    closedAt: "15 Sep 2026, 17:40",
    dueAt: "22 Sep 2026",
    slaTargetDays: 14,
    artefact: "Consent PCB/CTO/2026/0512",
    stages: [
      {
        id: "gs88-sampling",
        title: "Effluent Verification",
        departmentId: "pol",
        officer: "Sr. Environmental Officer, State PCB",
        completedAt: "11 Sep 2026, 15:30",
        slaDays: 4,
        artefacts: ["effluent.report.v1"],
        document: "Effluent analysis report",
        category: "Environmental",
        sizeKb: 2180,
        uploadedAt: "08 Sep 2026, 10:44",
      },
      {
        id: "gs88-consent",
        title: "Consent to Operate Issued",
        departmentId: "pol",
        officer: "State Pollution Control Board",
        completedAt: "15 Sep 2026, 17:40",
        slaDays: 7,
        artefacts: ["consent.v1"],
        document: "Commissioning report",
        category: "Environmental",
        sizeKb: 1340,
        uploadedAt: "08 Sep 2026, 10:50",
      },
    ],
  },
  {
    id: "GS-2026-00093",
    title: "Building Sanction Certificate",
    service: "Building Permission",
    profile: DEVELOPER,
    district: "Nandur Central Ward",
    summary:
      "Sanction for a four-storey residential block on an already verified parcel, coordinated with fire egress and labour registration.",
    submittedAt: "10 Sep 2026, 16:12",
    closedAt: "18 Sep 2026, 14:55",
    dueAt: "01 Oct 2026",
    slaTargetDays: 21,
    artefact: "Sanction BP/ND/2026/1170",
    stages: [
      {
        id: "gs93-permission",
        title: "Plan Review",
        departmentId: "mun",
        officer: "Building Permission Desk, Municipal Corporation",
        completedAt: "14 Sep 2026, 13:20",
        slaDays: 8,
        artefacts: ["permission.review.v1"],
        document: "Sanctioned plan drawing set",
        category: "Building plan",
        sizeKb: 9120,
        uploadedAt: "10 Sep 2026, 16:25",
      },
      {
        id: "gs93-fire",
        title: "Fire Egress Clearance",
        departmentId: "fire",
        officer: "Asst. Divisional Officer, Fire Services",
        completedAt: "16 Sep 2026, 11:45",
        slaDays: 6,
        artefacts: ["egress.clearance.v1"],
        document: "Access and egress plan",
        category: "Fire safety",
        sizeKb: 2860,
        uploadedAt: "12 Sep 2026, 10:15",
      },
      {
        id: "gs93-sanction",
        title: "Sanction Certificate Issued",
        departmentId: "mun",
        officer: "Municipal Corporation",
        completedAt: "18 Sep 2026, 14:55",
        slaDays: 7,
        artefacts: ["sanction.v1"],
        document: "Structural safety certificate",
        category: "Structural",
        sizeKb: 1400,
        uploadedAt: "10 Sep 2026, 16:30",
      },
    ],
  },
  {
    id: "GS-2026-00102",
    title: "Encumbrance Certificate",
    service: "Revenue Services",
    profile: DEVELOPER,
    district: "Nandur Central Ward",
    summary:
      "Search certificate over the project parcel, issued directly from the revenue parcel register.",
    submittedAt: "12 Sep 2026, 09:40",
    closedAt: "12 Sep 2026, 16:10",
    dueAt: "19 Sep 2026",
    slaTargetDays: 7,
    artefact: "Certificate EC/ND/2026/0771",
    stages: [
      {
        id: "gs102-search",
        title: "Register Search",
        departmentId: "rev",
        officer: "Sub-Registrar Office, Nandur",
        completedAt: "12 Sep 2026, 12:05",
        slaDays: 2,
        artefacts: ["encumbrance.clear.v1"],
        document: "Parcel reference slip",
        category: "Land record",
        sizeKb: 150,
        uploadedAt: "12 Sep 2026, 09:48",
      },
      {
        id: "gs102-certificate",
        title: "Certificate Issued",
        departmentId: "rev",
        officer: "Sub-Registrar Office, Nandur",
        completedAt: "12 Sep 2026, 16:10",
        slaDays: 2,
        artefacts: ["certificate.v1"],
        document: "Registered sale deed copy",
        category: "Land record",
        sizeKb: 1980,
        uploadedAt: "12 Sep 2026, 09:52",
      },
    ],
  },
  {
    id: "GS-2026-00108",
    title: "Establishment Labour Registration",
    service: "Labour Services",
    profile: TRADING,
    district: "Nandur Beach Ward",
    summary:
      "Registration of the restaurant establishment with the labour commissionerate, including the shift and muster record.",
    submittedAt: "11 Sep 2026, 12:35",
    closedAt: "17 Sep 2026, 12:10",
    dueAt: "25 Sep 2026",
    slaTargetDays: 14,
    artefact: "Registration LR/ND/2026/2294",
    stages: [
      {
        id: "gs108-entity",
        title: "Entity Resolution",
        departmentId: "lab",
        officer: "Registration Cell, Labour Dept.",
        completedAt: "12 Sep 2026, 10:50",
        slaDays: 2,
        artefacts: ["establishment.record.v1"],
        document: "Memorandum of association",
        category: "Entity record",
        sizeKb: 940,
        uploadedAt: "11 Sep 2026, 12:44",
      },
      {
        id: "gs108-registration",
        title: "Registration Issued",
        departmentId: "lab",
        officer: "Asst. Labour Commissioner",
        completedAt: "17 Sep 2026, 12:10",
        slaDays: 9,
        artefacts: ["establishment.reg.v1"],
        document: "Employee muster format",
        category: "Labour record",
        sizeKb: 310,
        uploadedAt: "11 Sep 2026, 12:49",
      },
    ],
  },
  {
    id: "GS-2026-00115",
    title: "Hazardous Waste Authorisation",
    service: "Environmental Clearance",
    profile: BIZ,
    district: "Nandur Industrial Belt",
    summary:
      "Authorisation for handling and transporting hazardous waste from the casting unit, granted with conditions.",
    submittedAt: "14 Sep 2026, 10:05",
    closedAt: "22 Sep 2026, 16:50",
    dueAt: "28 Sep 2026",
    slaTargetDays: 14,
    artefact: "Authorisation HW/ND/2026/0142",
    stages: [
      {
        id: "gs115-review",
        title: "Formulation Review",
        departmentId: "pol",
        officer: "State Pollution Control Board",
        completedAt: "18 Sep 2026, 14:15",
        slaDays: 4,
        artefacts: ["hw.formulation.v1"],
        document: "Waste stream description",
        category: "Environmental",
        sizeKb: 1120,
        uploadedAt: "14 Sep 2026, 10:20",
      },
      {
        id: "gs115-authorisation",
        title: "Authorisation Issued",
        departmentId: "pol",
        officer: "State Pollution Control Board",
        completedAt: "22 Sep 2026, 16:50",
        slaDays: 8,
        artefacts: ["authorisation.v1"],
        document: "Handler and transporter agreement",
        category: "Environmental",
        sizeKb: 860,
        uploadedAt: "14 Sep 2026, 10:26",
      },
    ],
  },
];

function buildArchivedApplication(seed: ArchivedSeed): Application {
  const documents: ApplicationDocument[] = seed.stages.map((stage, index) => ({
    id: `DOC-${seed.id.slice(-4)}${String.fromCharCode(65 + index)}`,
    name: stage.document,
    category: stage.category,
    uploadedAt: stage.uploadedAt,
    sizeKb: stage.sizeKb,
    status: "verified",
    verifiedBy:
      seed.stages.find((candidate) => candidate.departmentId === stage.departmentId)
        ?.title ?? stage.title,
    origin: "Applicant upload",
  }));

  const approvals: Approval[] = [
    {
      id: `${seed.id.slice(-4).toLowerCase()}-submitted`,
      order: 1,
      title: "Application Submitted",
      departmentId: "govsync",
      state: "approved",
      completion: 100,
      description:
        "Applicant submits one form with a reusable document set. GovSync validates the payload and starts the workflow.",
      startedAt: seed.submittedAt,
      completedAt: seed.submittedAt,
      actor: "Applicant portal",
      slaDays: 0,
      dependsOn: [],
      outputArtifacts: ["application.form.v1", "document.set.v1"],
      remark: `Reference ${seed.id} issued.`,
    },
    ...seed.stages.map((stage, index) => ({
      id: stage.id,
      order: index + 2,
      title: stage.title,
      departmentId: stage.departmentId,
      state: "approved" as const,
      completion: 100,
      description: `${stage.title} completed by the ${stage.departmentId} department and published to the applicant vault.`,
      startedAt: index === 0 ? seed.submittedAt : (seed.stages[index - 1]?.completedAt ?? seed.submittedAt),
      completedAt: stage.completedAt,
      actor: stage.officer,
      slaDays: stage.slaDays,
      dependsOn:
        index === 0
          ? [`${seed.id.slice(-4).toLowerCase()}-submitted`]
          : [seed.stages[index - 1]?.id ?? stage.id],
      outputArtifacts: stage.artefacts,
      remark: `Cleared within the ${stage.slaDays}-day stage target.`,
    })),
    {
      id: `${seed.id.slice(-4).toLowerCase()}-issued`,
      order: seed.stages.length + 2,
      title: "Record Issued",
      departmentId: "govsync",
      state: "approved",
      completion: 100,
      description:
        "The final artefact is sealed in the audit ledger and published to the applicant's document vault.",
      startedAt: seed.closedAt,
      completedAt: seed.closedAt,
      actor: "GovSync Platform",
      slaDays: 0,
      dependsOn: seed.stages.map((stage) => stage.id),
      outputArtifacts: ["issuance.record.v1"],
      remark: `${seed.artefact} published.`,
    },
  ];

  const tracks: DepartmentTrack[] = seed.stages.map((stage, index) => {
    const approval = approvals[index + 1];
    const required: RequiredDocument[] = documents
      .filter((document) => document.verifiedBy === approval?.title)
      .map((document) => ({
        name: document.name,
        mandatory: true,
        owedBy: "applicant",
        state: "received",
        receivedAt: document.uploadedAt,
      }));

    return {
      departmentId: stage.departmentId,
      state: "approved",
      approvalId: stage.id,
      lastUpdated: stage.completedAt,
      dependsOn: approval?.dependsOn ?? [],
      documents: required,
      officer: stage.officer,
      slaTargetDays: stage.slaDays,
      remark: `Cleared. Published artefact: ${stage.artefacts.join(", ")}.`,
    };
  });

  return {
    id: seed.id,
    title: seed.title,
    service: seed.service,
    applicantKind: seed.profile.applicantKind,
    applicantName: seed.profile.applicantName ?? "Demo applicant",
    entityType: seed.profile.entityType ?? "Individual",
    identifierMasked: seed.profile.identifierMasked ?? "Reference withheld",
    contactMasked: seed.profile.contactMasked ?? "Contact withheld",
    district: seed.district,
    filedVia: "GovSync Unified Portal",
    submittedAt: seed.submittedAt,
    lastUpdated: seed.closedAt,
    state: "completed",
    priority: "standard",
    dueAt: seed.dueAt,
    slaTargetDays: seed.slaTargetDays,
    elapsedDays: daysBetween(seed.submittedAt, seed.closedAt),
    summary: seed.summary,
    tracks,
    approvals,
    documents,
    activities: [
      {
        id: `AC-${seed.id.slice(-4)}-02`,
        at: seed.closedAt,
        actor: "GovSync",
        actorRole: "Platform",
        action: "Application completed",
        detail: `${seed.artefact} sealed in the audit ledger and published to the applicant vault.`,
      },
      {
        id: `AC-${seed.id.slice(-4)}-01`,
        at: seed.submittedAt,
        actor: "GovSync",
        actorRole: "Platform",
        action: "Application submitted successfully",
        detail: `${documents.length} documents validated against the canonical schema.`,
      },
    ],
  };
}

export const applications: Application[] = [
  manufacturingUnit,
  restaurantLicence,
  commercialBuilding,
  ...archivedSeeds.map(buildArchivedApplication),
];

export const applicationById = (id: string): Application | undefined =>
  applications.find((application) => application.id === id);

export const primaryApplicationId = manufacturingUnit.id;

export const activeApplications = applications.filter(
  (application) => application.state !== "completed",
);

export const completedApplications = applications.filter(
  (application) => application.state === "completed",
);

export const isActive = (application: Application): boolean =>
  application.state !== "completed";

/**
 * Application-level completion. Every stage contributes equally, using the
 * completion recorded against that stage, so preparatory work on queued
 * stages still counts towards the applicant's view of progress.
 */
export function applicationProgress(application: Application): number {
  if (application.approvals.length === 0) return 0;
  const total = application.approvals.reduce(
    (sum, approval) => sum + approval.completion,
    0,
  );
  return Math.round(total / application.approvals.length);
}

/** Approved stages, phrased for the applicant rather than the engine. */
export function approvedCount(application: Application): number {
  return application.approvals.filter((approval) => approval.state === "approved")
    .length;
}

/** The stage the applicant should look at next. */
export function currentApproval(application: Application): Approval | undefined {
  return application.approvals.find(
    (approval) => approval.state === "under-review" || approval.state === "action-required",
  ) ?? application.approvals.find((approval) => approval.state !== "approved");
}

export function currentStageLabel(application: Application): string {
  return currentApproval(application)?.title ?? "Completed";
}

export function hasBlockedStage(application: Application): boolean {
  return application.approvals.some((approval) => approval.state === "blocked");
}

export function departmentsOf(application: Application): string[] {
  return Array.from(new Set(application.tracks.map((track) => track.departmentId)));
}
