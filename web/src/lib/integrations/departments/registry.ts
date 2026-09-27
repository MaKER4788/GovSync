/**
 * The department connector registry.
 *
 * One entry per simulated department. The integration layer resolves a
 * department id here and never imports a service directly, so adding a
 * department is a change to this file alone.
 */

import { connectedDepartmentIds } from "@/lib/data/departments";
import { fireConnector, type FireProfile, type FireStatus } from "@/lib/integrations/departments/fire";
import { labourConnector, type LabourProfile, type LabourStatus } from "@/lib/integrations/departments/labour";
import { pollutionConnector, type PollutionProfile, type PollutionStatus } from "@/lib/integrations/departments/pollution";
import { revenueConnector, type RevenueProfile, type RevenueStatus } from "@/lib/integrations/departments/revenue";
import type { DepartmentConnector, DepartmentProfile } from "@/lib/integrations/types";

export type AnyDepartmentStatus =
  | FireStatus
  | LabourStatus
  | PollutionStatus
  | RevenueStatus;

export type AnyDepartmentConnector = DepartmentConnector<
  AnyDepartmentStatus,
  DepartmentProfile
>;

export interface DepartmentDescriptor {
  departmentId: string;
  departmentName: string;
  shortName: string;
  code: string;
  slug: string;
  systemName: string;
  baseUrl: string;
  apiVersion: string;
}

const registry = new Map<string, AnyDepartmentConnector>([
  [revenueConnector.departmentId, revenueConnector],
  [pollutionConnector.departmentId, pollutionConnector],
  [labourConnector.departmentId, labourConnector],
  [fireConnector.departmentId, fireConnector],
]);

/** Department ids that have a connector behind them. */
export const connectedConnectorIds: string[] = connectedDepartmentIds.filter((id) =>
  registry.has(id),
);

/** Resolves a connector, or null when no simulated department matches. */
export function connectorFor(departmentId: string): AnyDepartmentConnector | null {
  return registry.get(departmentId) ?? null;
}

/** Every connector, in the order the platform addresses departments. */
export function allConnectors(): AnyDepartmentConnector[] {
  return connectedConnectorIds
    .map((id) => registry.get(id))
    .filter((connector): connector is AnyDepartmentConnector => Boolean(connector));
}

export function descriptorFor(
  departmentId: string,
): DepartmentDescriptor | null {
  const connector = connectorFor(departmentId);
  if (!connector) return null;
  const profile = connector.getDepartment().data;
  if (!profile) return null;
  return {
    departmentId,
    departmentName: profile.departmentName,
    shortName: profile.departmentName,
    code: departmentId.toUpperCase(),
    slug: connector.departmentSlug,
    systemName: profile.systemName,
    baseUrl: profile.baseUrl,
    apiVersion: profile.apiVersion,
  };
}

export { revenueConnector, pollutionConnector, labourConnector, fireConnector };
export type { FireProfile, FireStatus, LabourProfile, LabourStatus, PollutionProfile, PollutionStatus, RevenueProfile, RevenueStatus };
