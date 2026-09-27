import { stampOrder } from "@/lib/format";
import type { Notification } from "@/lib/types";

/**
 * SIMULATED notification feed for the demo applicant identity. Every notice
 * references an application that exists in the shared record set, and the feed
 * is ordered newest first against the frozen simulation clock.
 */
const feed: Notification[] = [
  {
    id: "NTF-5580",
    title: "Action required: upload revised site plan",
    message:
      "The Pollution Control Board needs the inspection access marked on your site plan before an inspection slot can be booked on GS-2026-00142. Demo deadline 30 Sep 2026.",
    at: "27 Sep 2026, 10:44",
    severity: "error",
    read: false,
    channel: "portal",
    applicationId: "GS-2026-00142",
  },
  {
    id: "NTF-5578",
    title: "Consent application moved to Under Review",
    message:
      "Consent reference PCB/CTE/2026/0418 is now being examined. Land verification has already been approved and published to the shared record.",
    at: "27 Sep 2026, 10:42",
    severity: "info",
    read: false,
    channel: "sms",
    applicationId: "GS-2026-00142",
  },
  {
    id: "NTF-5561",
    title: "Action required: provide building layout",
    message:
      "The Fire Department cannot assign an occupancy class to GS-2026-00137 without a scaled building layout. Demo deadline 29 Sep 2026.",
    at: "26 Sep 2026, 11:20",
    severity: "error",
    read: false,
    channel: "email",
    applicationId: "GS-2026-00137",
  },
  {
    id: "NTF-5552",
    title: "Land verification approved",
    message:
      "Parcel 118/B is verified with no registered encumbrance. The verified parcel record has been forwarded to the pollution consent register automatically.",
    at: "26 Sep 2026, 16:18",
    severity: "success",
    read: true,
    channel: "portal",
    applicationId: "GS-2026-00142",
  },
  {
    id: "NTF-5540",
    title: "Effluent report accepted",
    message:
      "Your third-party analysis report was accepted on first submission and is now part of the shared document set for GS-2026-00142.",
    at: "22 Sep 2026, 14:10",
    severity: "success",
    read: true,
    channel: "email",
    applicationId: "GS-2026-00142",
  },
  {
    id: "NTF-5523",
    title: "Hazardous waste authorisation issued",
    message:
      "Authorisation HW/ND/2026/0142 is available in your document vault, with conditions recorded against the waste streams.",
    at: "22 Sep 2026, 16:52",
    severity: "success",
    read: true,
    channel: "portal",
    applicationId: "GS-2026-00115",
  },
  {
    id: "NTF-5517",
    title: "Building plan set under review",
    message:
      "The municipal building permission desk is reviewing the floor-area ratio on GS-2026-00129. Setback compliance is already confirmed.",
    at: "25 Sep 2026, 15:05",
    severity: "info",
    read: true,
    channel: "portal",
    applicationId: "GS-2026-00129",
  },
];

export const notifications: Notification[] = feed.sort(
  (a, b) => stampOrder(b.at) - stampOrder(a.at),
);

export const unreadNotificationCount = notifications.filter(
  (notification) => !notification.read,
).length;

export const notificationsForApplication = (applicationId: string): Notification[] =>
  notifications.filter(
    (notification) => notification.applicationId === applicationId,
  );
