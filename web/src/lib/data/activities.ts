import type { Activity, Application } from "@/lib/types";
import { stampOrder } from "@/lib/format";
import { applications } from "@/lib/data/applications";

/**
 * Activity feed. The records live on each application, so the timeline shown
 * on a detail page and the activity shown on the dashboard are the same
 * entries. These selectors only order and scope them.
 */

export interface ActivityEntry extends Activity {
  applicationId: string;
  applicationTitle: string;
}

function toEntries(list: Application[]): ActivityEntry[] {
  return list.flatMap((application) =>
    application.activities.map((activity) => ({
      ...activity,
      applicationId: application.id,
      applicationTitle: application.title,
    })),
  );
}

/** Newest first. */
export function activitiesForApplication(
  applicationId: string,
): ActivityEntry[] {
  return toEntries(
    applications.filter((application) => application.id === applicationId),
  ).sort((a, b) => stampOrder(b.at) - stampOrder(a.at));
}

/** Newest first, across every application. */
export function recentActivities(
  limit?: number,
  list: Application[] = applications,
): ActivityEntry[] {
  const sorted = toEntries(list).sort(
    (a, b) => stampOrder(b.at) - stampOrder(a.at),
  );
  return typeof limit === "number" ? sorted.slice(0, limit) : sorted;
}

export function activitiesForDepartment(departmentName: string): ActivityEntry[] {
  return recentActivities().filter(
    (entry) => entry.actor.toLowerCase().includes(departmentName.toLowerCase()),
  );
}
