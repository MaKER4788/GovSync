"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { History, Info, Layers, Network, TriangleAlert } from "lucide-react";

import { ActivityTimeline } from "@/components/govsync/activity-timeline";
import { DepartmentStatusPanel } from "@/components/govsync/integration/department-status-panel";
import { SectionHeading } from "@/components/govsync/page-header";
import { DemoControls } from "@/components/govsync/workflow/demo-controls";
import { WorkflowDetailPanel } from "@/components/govsync/workflow/workflow-detail-panel";
import { WorkflowFilters } from "@/components/govsync/workflow/workflow-filters";
import { WorkflowSummaryBar, WorkflowStateLegend } from "@/components/govsync/workflow/workflow-summary";
import { WorkflowTimeline } from "@/components/govsync/workflow/workflow-timeline";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { ActivityEntry } from "@/lib/data/activities";
import { connectedDepartmentIds, departmentLabel } from "@/lib/data/departments";
import { formatStamp, stampOrder } from "@/lib/format";
import {
  DEPARTMENT_STATUS_FOR,
  publishDecision,
  wasQueued,
} from "@/lib/govsync/client";
import type { WorkflowStageState } from "@/lib/integrations/types";
import { nextStageOf, applyAuthoritativeStates, runCommand } from "@/lib/workflow/engine";
import { cn } from "@/lib/utils";
import type { WorkflowState } from "@/lib/types";
import {
  filterWorkflow,
  summariseWorkflow,
} from "@/lib/workflow/summary";
import type {
  TransitionNotice,
  WorkflowCommand,
  WorkflowFilterId,
  WorkflowSnapshot,
} from "@/lib/workflow/types";

/**
 * The Phase 3 unified approval workflow.
 *
 * This is the only client component in the feature. It receives the projected
 * `WorkflowSnapshot` from the server-rendered detail page, holds the simulated
 * stage list and activity feed in React state, and dispatches the engine's pure
 * commands. Nothing is written back to the canonical record set, so a refresh
 * returns the workflow to the recorded state, and two reviewers running the
 * same clicks see the same result because the engine never reads the host
 * clock.
 */

interface SimulationState {
  stages: WorkflowSnapshot["stages"];
  activities: ActivityEntry[];
  clock: string;
  notices: TransitionNotice[];
  selectedId: string | null;
  filter: WorkflowFilterId;
  changedIds: string[];
  sequence: number;
  /** Latest publish result, so a departmental fault is visible where it happened. */
  publish: PublishNote | null;
  publishing: boolean;
  /**
   * A decision that still has to be told to a department. It lives in state
   * rather than in a local variable because the engine runs inside the state
   * updater, and React is free to invoke that updater later than the call site.
   * Reading a variable the updater wrote would therefore be a race.
   */
  publishRequest: PublishRequest | null;
}

export interface PublishNote {
  stageId: string;
  departmentId: string;
  departmentName: string;
  delivered: boolean;
  queued: boolean;
  message: string;
  requestId: string;
  attempts: number;
}

export interface PublishRequest {
  /** Distinguishes one decision from the next, so an effect fires once. */
  token: number;
  stageId: string;
  /** `null` when the stage is a GovSync record and has no connector. */
  departmentId: string;
  status: WorkflowState;
  reason: string;
}

/** Departments with a connector in this phase. A stage outside this set is a
 *  GovSync record, so a decision on it is never published anywhere. */
const CONNECTED_DEPARTMENT_IDS: ReadonlySet<string> = new Set(connectedDepartmentIds);

/** A decision on a GovSync-owned stage is recorded, but has nowhere to publish. */
function platformNote(stageId: string): PublishNote {
  return {
    stageId,
    departmentId: "govsync",
    departmentName: "GovSync",
    delivered: true,
    queued: false,
    message:
      "This stage is a GovSync record rather than a departmental one, so no connector was called. The decision is held in the workflow only.",
    requestId: "not applicable",
    attempts: 0,
  };
}

function initialState(snapshot: WorkflowSnapshot): SimulationState {
  return {
    stages: snapshot.stages,
    activities: snapshot.activities.map((activity) => ({
      ...activity,
      applicationId: snapshot.applicationId,
      applicationTitle: snapshot.applicationTitle,
    })),
    clock: snapshot.clockStart,
    notices: [],
    selectedId: snapshot.initialStageId,
    filter: "all",
    changedIds: [],
    sequence: 0,
    publish: null,
    publishing: false,
    publishRequest: null,
  };
}

export function UnifiedWorkflow({ snapshot }: { snapshot: WorkflowSnapshot }) {
  const [state, setState] = useState<SimulationState>(() => initialState(snapshot));

  const summary = useMemo(() => summariseWorkflow(state.stages), [state.stages]);
  const visible = useMemo(
    () => filterWorkflow(state.stages, state.filter),
    [state.stages, state.filter],
  );

  const selected = useMemo(
    () =>
      state.stages.find((stage) => stage.id === state.selectedId) ?? null,
    [state.stages, state.selectedId],
  );

  const selectedNext = useMemo(
    () => (selected ? nextStageOf(state.stages, selected.id) : null),
    [state.stages, selected],
  );

  const dispatch = useCallback(
    (kind: WorkflowCommand["kind"]) => {
      setState((current) => {
        const targetId = current.selectedId ?? current.stages[0]?.id;
        if (!targetId) return current;

        const working: WorkflowSnapshot = {
          ...snapshot,
          stages: current.stages,
          activities: snapshot.activities,
          clockStart: current.clock,
        };

        const result = runCommand(working, { kind, stageId: targetId });
        const applied = result.notices[0];
        const sequence = current.sequence + 1;

        const appended: ActivityEntry[] = applied?.activity
          ? [
              {
                ...applied.activity,
                applicationId: snapshot.applicationId,
                applicationTitle: snapshot.applicationTitle,
              },
              ...current.activities,
            ]
          : current.activities;

        const stage = result.stages.find((candidate) => candidate.id === targetId);
        const reason = applied?.detail ?? "Decided in the GovSync workflow.";
        const decided = Boolean(applied && stage);
        const connected = decided && CONNECTED_DEPARTMENT_IDS.has(stage!.departmentId);

        return {
          ...current,
          stages: result.stages,
          activities: appended.sort(
            (a, b) => stampOrder(b.at) - stampOrder(a.at),
          ),
          clock: result.clock,
          notices: result.notices,
          selectedId: targetId,
          changedIds: applied?.stageIds ?? [],
          sequence,
          // Only a real transition is worth telling a department about, and only
          // if the stage belongs to one. A refused command produces no notice, so
          // there is no decision to relay.
          publish: decided && !connected ? platformNote(targetId) : null,
          publishing: connected,
          publishRequest: connected
            ? {
                token: sequence,
                stageId: targetId,
                departmentId: stage!.departmentId,
                status: stage!.state,
                reason,
              }
            : null,
        };
      });
    },
    [snapshot],
  );

  // The workflow moves first and the department is told afterwards. That order is
  // the point: a connector that refuses the decision cannot take the decision
  // back, so GovSync queues it instead of losing it.
  useEffect(() => {
    const request = state.publishRequest;
    if (request === null) return;

    const departmentId = request.departmentId;
    let cancelled = false;

    void (async () => {
      const response = await publishDecision({
        applicationId: snapshot.applicationId,
        departmentId,
        stageId: request.stageId,
        status: DEPARTMENT_STATUS_FOR[request.status],
        reason: request.reason,
        decidedBy: "Demo Reviewer (platform operator)",
      });
      if (cancelled) return;
      const note: PublishNote = response.success
        ? {
            stageId: request.stageId,
            departmentId,
            departmentName: response.data.departmentName,
            delivered: response.data.delivered,
            queued: response.data.queued,
            message: response.data.message,
            requestId: response.data.requestId,
            attempts: response.data.attempts,
          }
        : {
            stageId: request.stageId,
            departmentId,
            departmentName: departmentLabel(departmentId),
            delivered: false,
            // A refusal is not a lost decision. The failure envelope says whether
            // the decision went into the outbox, and the note has to agree with it
            // rather than implying either way.
            queued: wasQueued(response),
            message: response.error.message,
            requestId: response.requestId,
            attempts: response.attempts,
          };
      // Ignore a reply that a newer decision has already overtaken.
      setState((current) =>
        current.publishRequest?.token === request.token
          ? { ...current, publish: note, publishing: false }
          : current,
      );
    })();

    return () => {
      cancelled = true;
    };
  }, [snapshot.applicationId, state.publishRequest]);

  const reset = useCallback(() => {
    setState((current) => ({
      ...initialState(snapshot),
      notices: [
        {
          id: "TN-reset",
          at: snapshot.clockStart,
          kind: "approve",
          tone: "info",
          title: "Demo reset to the recorded state",
          detail: `All ${snapshot.stages.length} stages returned to the values held in the simulated record set. ${
            current.sequence
          } simulated transition${current.sequence === 1 ? "" : "s"} discarded.`,
          stageIds: snapshot.stages.map((stage) => stage.id),
        },
      ],
      sequence: 0,
      publish: null,
      publishing: false,
      publishRequest: null,
    }));
  }, [snapshot]);

  const select = useCallback((stageId: string) => {
    setState((current) => ({
      ...current,
      selectedId: stageId,
      changedIds: current.changedIds.filter((id) => id !== stageId),
    }));
  }, []);

  const selectFilter = useCallback((filter: WorkflowFilterId) => {
    setState((current) => ({ ...current, filter }));
  }, []);

  /**
   * Adopts a synchronised graph. The connector is the authority on its own
   * stage, so after a sync the stage list above reflects what the departments
   * actually hold rather than what GovSync last assumed. The engine settles the
   * graph the same way it does after a local command, so a departmental change
   * cascades through dependent stages in the usual way.
   */
  const adoptReconciled = useCallback(
    (reconciled: WorkflowStageState[], at: string) => {
      setState((current) => {
        const authoritative: Record<string, WorkflowState> = {};
        for (const stage of reconciled) {
          if (stage.authoritative) authoritative[stage.id] = stage.state;
        }
        if (Object.keys(authoritative).length === 0) return current;

        const working: WorkflowSnapshot = {
          ...snapshot,
          stages: current.stages,
          activities: snapshot.activities,
          clockStart: current.clock,
        };
        const settled = applyAuthoritativeStates(working, authoritative, at);
        const changed = settled.stages
          .filter((stage) => {
            const before = current.stages.find((entry) => entry.id === stage.id);
            return before !== undefined && before.state !== stage.state;
          })
          .map((stage) => stage.id);

        if (changed.length === 0) return current;

        return {
          ...current,
          stages: settled.stages,
          clock: at,
          notices: [
            {
              id: "TN-reconciled",
              at,
              kind: "next",
              tone: "info",
              title: "Departmental record adopted",
              detail: `A synchronisation replaced the local assumption for ${changed.length} stage${
                changed.length === 1 ? "" : "s"
              }. A department is the authority on its own stage, so GovSync took the departmental value.`,
              stageIds: changed,
            },
            ...current.notices,
          ],
          changedIds: changed,
          sequence: current.sequence + 1,
          publish: null,
          publishing: false,
          publishRequest: null,
        };
      });
    },
    [snapshot],
  );

  if (snapshot.stages.length === 0) {
    return (
      <Card>
        <CardHeader>
          <SectionHeading
            title="Unified approval workflow"
            description="No approval stages are recorded against this application."
          />
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-dashed border-border px-4 py-8 text-center">
            <Layers className="mt-0.5 mx-auto size-5 text-muted-2" />
            <p className="mt-2 text-sm font-medium text-foreground">
              This application has no workflow
            </p>
            <p className="mx-auto mt-1.5 max-w-md text-xs leading-relaxed text-muted">
              No approval stages were recorded, so there is no dependency graph to
              resolve and no stage that can be approved, blocked or handed over. A
              production deployment would reject an application in this state at
              intake rather than leave it without a workflow.
            </p>
          </div>
          <WorkflowWarnings snapshot={snapshot} />
        </CardContent>
      </Card>
    );
  }

  const latestNotice = state.notices[0] ?? null;

  return (
    <div className="space-y-6">
      {/* Header, summary, controls */}
      <Card>
        <CardHeader>
          <SectionHeading
            title="Unified approval workflow"
            description={`${summary.total} stages across ${new Set(
              state.stages.map((stage) => stage.departmentId),
            ).size} departments, resolved from one application reference. Every state below is simulated.`}
            action={
              <span className="font-mono text-[11px] text-muted-2">
                {snapshot.applicationId}
              </span>
            }
          />
        </CardHeader>
        <CardContent className="space-y-4">
          <WorkflowSummaryBar summary={summary} />
          <WorkflowStateLegend className="border-t border-border-subtle pt-3" />
          <DemoControls
            className="border-t border-border-subtle pt-4"
            stageTitle={selected?.title ?? "No stage selected"}
            canProceed={selected?.eligibility.canProceed ?? false}
            onCommand={dispatch}
            onReset={reset}
            disabled={!selected}
            clock={state.clock}
            notice={latestNotice}
            transitionCount={state.sequence}
          />
          {state.publishing || state.publish ? (
            <PublishNotice note={state.publish} busy={state.publishing} />
          ) : null}
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardContent className="py-4">
          <WorkflowFilters
            stages={state.stages}
            active={state.filter}
            onChange={selectFilter}
          />
          <p className="mt-3 text-[11px] leading-relaxed text-muted-2">
            Showing {visible.length} of {summary.total} stages
            {state.filter !== "all" ? ` matching ${state.filter.replace("-", " ")}` : ""}.
            Filters only change what is listed; the summary above always counts every
            stage.
          </p>
        </CardContent>
      </Card>

      {visible.length === 0 ? (
        <Card>
          <CardContent>
            <div className="rounded-lg border border-dashed border-border px-4 py-8 text-center">
              <Info className="mx-auto size-5 text-muted-2" />
              <p className="mt-2 text-sm font-medium text-foreground">
                No stage in this state
              </p>
              <p className="mx-auto mt-1.5 max-w-md text-xs leading-relaxed text-muted">
                Nothing on this application is currently filtered to
                {" "}
                <span className="font-medium text-foreground">
                  {state.filter.replace("-", " ")}
                </span>
                . Choose another filter to see the remaining stages.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)]">
          <Card>
            <CardHeader>
              <SectionHeading
                title="Approval chain"
                description="Top to bottom, in routing order. Select a stage to open its full record in the panel beside it."
              />
            </CardHeader>
            <CardContent>
              <WorkflowTimeline
                stages={visible}
                selectedId={state.selectedId}
                changedIds={state.changedIds}
                onSelect={select}
              />
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <SectionHeading
                  title="Stage detail"
                  description={
                    selected
                      ? `${selected.title}, handled by ${departmentLabel(selected.departmentId)}.`
                      : "Select a stage from the chain."
                  }
                />
              </CardHeader>
              <CardContent>
                <WorkflowDetailPanel stage={selected} nextStage={selectedNext} />
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Live departmental answers, read back through the connectors */}
      <DepartmentStatusPanel
        applicationId={snapshot.applicationId}
        onReconciled={adoptReconciled}
      />

      {/* Simulation activity feed */}
      <Card>
        <CardHeader>
          <SectionHeading
            title="Workflow activity"
            description="The recorded application timeline, with every simulated transition appended at the top."
            action={
              <span className="inline-flex items-center gap-1.5 text-[11px] text-muted-2 tabular">
                <History className="size-3.5" />
                {state.activities.length} entries
              </span>
            }
          />
        </CardHeader>
        <CardContent>
          <ActivityTimeline entries={state.activities.slice(0, 12)} />
          {state.activities.length > 12 ? (
            <p className="mt-3 border-t border-border-subtle pt-3 text-[11px] text-muted-2">
              Showing the 12 most recent of {state.activities.length} entries. The full
              record set is unchanged by this simulation.
            </p>
          ) : null}
        </CardContent>
      </Card>

      <WorkflowWarnings snapshot={snapshot} />
    </div>
  );
}

/**
 * What the department said about the decision the workflow just made. Shown
 * beside the controls because a refusal here is the most important thing on the
 * page: the stage above has already moved, and this explains who did not get
 * the message.
 */
function PublishNotice({ note, busy }: { note: PublishNote | null; busy: boolean }) {
  return (
    <div
      className={cn(
        "rounded-lg border p-3",
        busy
          ? "border-border-subtle bg-surface-2"
          : note?.delivered
            ? "border-success/25 bg-success/8"
            : "border-warning/30 bg-warning/8",
      )}
    >
      <p className="flex flex-wrap items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-2">
        <Network className="size-3.5" />
        {busy ? "Publishing to the department" : "Publication result"}
      </p>
      <p className="mt-1.5 text-[11px] leading-relaxed text-muted">
        {busy
          ? "The workflow has already recorded the decision. Waiting on the connector."
          : note?.message}
      </p>
      {note && !busy ? (
        <p className="mt-1.5 font-mono text-[10px] text-muted-2">
          {note.departmentName} · {note.requestId}
          {note.attempts > 1 ? ` · ${note.attempts} attempts` : ""}
          {note.queued ? " · queued for the next synchronisation" : ""}
        </p>
      ) : null}
    </div>
  );
}

/**
 * Record-quality problems found while projecting the application. Shown rather
 * than swallowed, because an unresolvable dependency must never look like a
 * stage that is simply waiting.
 */
function WorkflowWarnings({ snapshot }: { snapshot: WorkflowSnapshot }) {
  if (snapshot.warnings.length === 0) return null;

  return (
    <div className="rounded-lg border border-warning/25 bg-warning/8 p-4">
      <p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-warning">
        <TriangleAlert className="size-3.5" />
        Record quality notices ({snapshot.warnings.length})
      </p>
      <ul className="mt-2 space-y-1.5">
        {snapshot.warnings.map((warning, index) => (
          <li key={`${warning.kind}-${index}`} className="text-[11px] leading-relaxed text-muted">
            {warning.message}
          </li>
        ))}
      </ul>
      <p className="mt-2.5 text-[10px] leading-relaxed text-muted-2">
        Frozen dataset state at {formatStamp(snapshot.clockStart)}. The engine treats an
        unrecognised dependency as a hard block rather than assuming the artefact
        exists.
      </p>
    </div>
  );
}
