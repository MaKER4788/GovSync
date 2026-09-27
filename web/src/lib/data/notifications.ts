import type { NotificationItem } from "@/lib/types";

/** SIMULATED notification feed for the demo applicant identity. */
export const notifications: NotificationItem[] = [
  {
    id: "NTF-4412",
    title: "Fire NOC stage is on hold",
    message:
      "Stage 4 cannot progress until the Pollution Control consent reference is published. No action is required from you right now.",
    at: "12 Mar 2026, 11:12",
    severity: "warning",
    read: false,
    channel: "portal",
    applicationId: "GS-2026-00142",
  },
  {
    id: "NTF-4411",
    title: "Effluent report received by the board",
    message:
      "Your document was submitted once and is now under verification by the Pollution Control Board.",
    at: "12 Mar 2026, 10:48",
    severity: "info",
    read: false,
    channel: "portal",
    applicationId: "GS-2026-00142",
  },
  {
    id: "NTF-4408",
    title: "Action required: confirm property tax payment",
    message:
      "Application GS-2026-00119 needs payment confirmation of INR 18,400 to proceed.",
    at: "12 Mar 2026, 08:20",
    severity: "error",
    read: false,
    channel: "sms",
    applicationId: "GS-2026-00119",
  },
  {
    id: "NTF-4402",
    title: "Building plan set under review",
    message:
      "The municipal building permission desk is reviewing the revised plan set for GS-2026-00155.",
    at: "12 Mar 2026, 10:12",
    severity: "info",
    read: true,
    channel: "email",
    applicationId: "GS-2026-00155",
  },
  {
    id: "NTF-4391",
    title: "Trade licence renewed",
    message:
      "Trade licence TL/ND/2025/2210 is available in your document vault, valid until 31 Mar 2027.",
    at: "02 Mar 2026, 17:06",
    severity: "success",
    read: true,
    channel: "portal",
    applicationId: "GS-2026-00137",
  },
  {
    id: "NTF-4380",
    title: "Fire NOC issued",
    message:
      "Renewed no-objection certificate FS/2026/0442 has been published to your vault.",
    at: "27 Feb 2026, 12:16",
    severity: "success",
    read: true,
    channel: "email",
    applicationId: "GS-2026-00098",
  },
];

export const unreadNotificationCount = notifications.filter(
  (notification) => !notification.read,
).length;
