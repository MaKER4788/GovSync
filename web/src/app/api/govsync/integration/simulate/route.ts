import { json, readBody, refuse, roleFrom } from "@/lib/integrations/http";
import { planFailure } from "@/lib/integrations/operations";
import type { InjectedFailureMode } from "@/lib/integrations/types";

const MODES: readonly InjectedFailureMode[] = [
  "unavailable",
  "timeout",
  "malformed",
  "validation",
];

/**
 * POST /api/govsync/integration/simulate
 *
 * Body: `{ departmentId, mode, calls }`
 *
 * Plans a departmental failure, or clears every planned failure with
 * `departmentId: "none"`. A plan covers whole logical calls, so the retries
 * inside the call fail too, which is how the retry sequence becomes visible.
 * Requires the simulate scope; the portal uses the operator role.
 */
export async function POST(request: Request): Promise<Response> {
  const body = await readBody(request);
  if (!body.ok) return refuse(body.message);

  const record = (body.value ?? {}) as {
    departmentId?: string;
    mode?: string;
    calls?: number;
  };

  if (typeof record.departmentId !== "string" || record.departmentId.length === 0) {
    return refuse("Choose a department to fail, or \"none\" to clear every simulated failure.");
  }
  if (record.departmentId !== "none" && !MODES.includes(record.mode as InjectedFailureMode)) {
    return refuse(
      `Unknown failure mode "${record.mode ?? ""}". Expected one of ${MODES.join(", ")}.`,
    );
  }

  return json(
    planFailure(
      {
        departmentId: record.departmentId,
        mode: (record.mode ?? "unavailable") as InjectedFailureMode,
        calls: typeof record.calls === "number" ? record.calls : 1,
      },
      roleFrom(request),
    ),
  );
}
