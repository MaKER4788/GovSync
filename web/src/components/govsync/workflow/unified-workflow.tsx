"use client";

import { useCallback, useMemo, useState } from "react";
import { History, Info, Layers, TriangleAlert } from "lucide-react";

import { ActivityTimeline } from "@/components/govsync/activity-timeline";
import { SectionHeading } from "@/components/govsync/page-header";
import { DemoControls } from "@/components/govsync/workflow/demo-controls";
import { WorkflowDetailPanel } from "@/components/govsync/workflow/workflow-detail-panel";
import { WorkflowFilters } from "@/components/govsync/workflow/workflow-filters";
import { WorkflowSummaryBar, WorkflowStateLegend } from "@/components/govsync/workflow/workflow-summary";
import { WorkflowTimeline } from "@/components/govsync/workflow/workflow-timeline";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { ActivityEntry } from "@/lib/data/activities";
import { departmentLabel } from "@/lib/data/departments";
import { formatStamp, stampOrder } from "@/lib/format";
import { nextStageOf, runCommand } from "@/lib/workflow/engine";
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
        };
      });
    },
    [snapshot],
  );

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
