import { WorkflowConnector } from "@/components/govsync/workflow/workflow-connector";
import { WorkflowNode } from "@/components/govsync/workflow/workflow-node";
import type { WorkflowStage } from "@/lib/workflow/types";

/**
 * The vertical workflow rail.
 *
 * A single vertical layout serves every breakpoint: on a wide screen it sits
 * beside the detail panel, and on a phone it becomes the whole visualisation
 * with the detail panel directly beneath it. Nothing is horizontal, so there
 * is no sideways scroll at any width.
 */
export function WorkflowTimeline({
  stages,
  selectedId,
  changedIds,
  onSelect,
}: {
  stages: WorkflowStage[];
  selectedId: string | null;
  changedIds: string[];
  onSelect: (stageId: string) => void;
}) {
  return (
    <ol className="list-none p-0">
      {stages.map((stage, index) => {
        const next = stages[index + 1];

        return (
          <li key={stage.id} className="contents">
            <WorkflowNode
              stage={stage}
              selected={stage.id === selectedId}
              changed={changedIds.includes(stage.id)}
              onSelect={onSelect}
            />
            {next ? (
              <WorkflowConnector
                stage={next}
                previousTitle={stage.state === "approved" ? stage.title : null}
              />
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}
