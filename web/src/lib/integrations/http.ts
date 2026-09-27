/**
 * Route handler plumbing.
 *
 * Every GovSync endpoint answers with the same envelope, so a reviewer can tell
 * the shape of a response without knowing which endpoint produced it. The HTTP
 * status mirrors the fault: a departmental outage is a 503 on the GovSync route
 * even though GovSync itself is fine, because that is the truth the portal needs.
 *
 * Nothing here is a security boundary. In this prototype the role arrives in a
 * header chosen by the caller, which is exactly as trustworthy as a comment.
 * The scopes it is checked against in `service.ts` are real checks against that
 * claim; the claim itself is not proved.
 */

import { NextResponse } from "next/server";
import type { IntegrationFault, IntegrationRole, GovSyncResult } from "./types";

/** Roles a demo caller may present. The portal only ever uses the first three. */
const ROLES: readonly IntegrationRole[] = [
  "PLATFORM_OPERATOR",
  "DEPARTMENT_OFFICER",
  "APPLICANT",
  "ANONYMOUS",
];

export function roleFrom(request: Request): IntegrationRole {
  const header = request.headers.get("x-govsync-role");
  if (!header) return "PLATFORM_OPERATOR";
  const match = ROLES.find((role) => role === header);
  return match ?? "ANONYMOUS";
}

export function json(result: GovSyncResult<unknown>, init?: ResponseInit): NextResponse {
  if (result.success) {
    return NextResponse.json(result, { status: 200, ...init });
  }
  return NextResponse.json(result, { status: result.error.httpStatus, ...init });
}

/** Builds the same envelope for a fault raised before any layer was reached. */
export function refuse(message: string, detail?: string): NextResponse {
  const fault: IntegrationFault = {
    code: "INVALID_REQUEST",
    message,
    ...(detail === undefined ? {} : { detail }),
    retryable: false,
    httpStatus: 400,
  };
  return NextResponse.json(
    {
      success: false,
      requestId: "n/a",
      applicationId: null,
      department: null,
      operation: "READ_APPLICATION",
      error: fault,
      timestamp: "27 Sep 2026, 14:32",
      source: "GOVSYNC_INTEGRATION_LAYER",
      events: [],
      trace: [],
      attempts: 0,
    } satisfies GovSyncResult<never>,
    { status: 400 },
  );
}

/** Reads a JSON body, or refuses with a reason the caller can act on. */
export async function readBody(
  request: Request,
): Promise<{ ok: true; value: unknown } | { ok: false; message: string }> {
  try {
    return { ok: true, value: await request.json() };
  } catch {
    return {
      ok: false,
      message: "The request body was not valid JSON.",
    };
  }
}

/**
 * Context params arrive as a promise in Next 16, and the folder name is the
 * only place the shape is declared.
 */
export async function segment(
  params: Promise<Record<string, string | string[] | undefined>>,
  key: string,
): Promise<string | null> {
  const value = (await params)[key];
  if (typeof value !== "string") return null;
  return value;
}
