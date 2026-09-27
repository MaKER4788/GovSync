import { Check, Clock3, FileText, TriangleAlert } from "lucide-react";

import { formatStamp } from "@/lib/format";
import type { DocumentObligation, StageDocumentState } from "@/lib/types";
import type { StageDocument } from "@/lib/workflow/types";
import { cn } from "@/lib/utils";

/**
 * Document requirements for one workflow stage.
 *
 * The prototype has no upload path, so this list is read-only by construction:
 * it shows what a stage needs, what it already has, and what is still
 * outstanding, with the state written out in words as well as colour. A
 * requirement the department or the platform owes is separated from an
 * applicant obligation, so the applicant is never shown something they cannot
 * supply.
 */

const owedByLabel: Record<DocumentObligation, string> = {
  applicant: "From applicant",
  department: "From department",
  platform: "From platform",
};

const stateMeta: Record<
  StageDocumentState,
  { label: string; icon: typeof Check; chip: string; text: string }
> = {
  submitted: {
    label: "Submitted",
    icon: FileText,
    chip: "border-info/30 bg-info/10 text-info",
    text: "text-info",
  },
  verified: {
    label: "Verified",
    icon: Check,
    chip: "border-success/35 bg-success/10 text-success",
    text: "text-success",
  },
  pending: {
    label: "Pending",
    icon: Clock3,
    chip: "border-warning/35 bg-warning/10 text-warning",
    text: "text-warning",
  },
};

export function StageDocumentList({
  documents,
  className,
}: {
  documents: StageDocument[];
  className?: string;
}) {
  if (documents.length === 0) {
    return (
      <p className="rounded-md border border-dashed border-border px-3 py-4 text-xs text-muted-2">
        No documents are required at this stage. The department publishes its result
        from the records it already holds.
      </p>
    );
  }

  const outstanding = documents.filter(
    (document) => document.owedBy === "applicant" && document.state === "pending",
  );
  const expected = documents.filter(
    (document) => document.owedBy !== "applicant" && document.state === "pending",
  );

  return (
    <div className={cn("space-y-2", className)}>
      {outstanding.length > 0 ? (
        <p className="flex items-start gap-2 rounded-md border border-warning/25 bg-warning/8 px-3 py-2 text-[11px] leading-relaxed text-muted">
          <TriangleAlert className="mt-0.5 size-3.5 shrink-0 text-warning" />
          <span>
            {outstanding.length} of {documents.length} outstanding. This stage cannot be
            approved until the applicant responds.
          </span>
        </p>
      ) : null}

      {expected.length > 0 ? (
        <p className="flex items-start gap-2 rounded-md border border-border-subtle bg-surface-2/60 px-3 py-2 text-[11px] leading-relaxed text-muted-2">
          <Clock3 className="mt-0.5 size-3.5 shrink-0" />
          <span>
            {expected.length} expected from{" "}
            {expected.length === 1 ? "a department or the platform" : "departments or the platform"}.
            These arrive on their own and are not requested from the applicant.
          </span>
        </p>
      ) : null}

      <ul className="space-y-1.5">
        {documents.map((document) => {
          const meta = stateMeta[document.state];
          const Icon = meta.icon;

          return (
            <li
              key={document.id}
              className="flex flex-col gap-1.5 rounded-md border border-border-subtle bg-surface-2/40 px-3 py-2 sm:flex-row sm:items-start sm:justify-between sm:gap-3"
            >
              <div className="min-w-0">
                <p className="text-xs font-medium text-foreground">
                  {document.name}
                  <span className="ml-1.5 text-[10px] font-normal uppercase tracking-wider text-muted-2">
                    {document.mandatory ? "Mandatory" : "Optional"} &middot;{" "}
                    {owedByLabel[document.owedBy]}
                  </span>
                </p>
                {document.receivedAt ? (
                  <p className="mt-0.5 text-[10px] text-muted-2 tabular">
                    Received {formatStamp(document.receivedAt)}
                  </p>
                ) : null}
                {document.note ? (
                  <p className="mt-1 text-[11px] leading-relaxed text-muted-2">
                    {document.note}
                  </p>
                ) : null}
              </div>
              <span
                className={cn(
                  "inline-flex shrink-0 items-center gap-1.5 self-start rounded border px-2 py-0.5 text-[10px] font-medium tracking-wide whitespace-nowrap",
                  meta.chip,
                )}
              >
                <Icon className="size-3" />
                {meta.label}
              </span>
            </li>
          );
        })}
      </ul>

      <p className="border-t border-border-subtle pt-2 text-[10px] leading-relaxed text-muted-2">
        States are read-only in this prototype. No document can be uploaded,
        replaced or withdrawn from here.
      </p>
    </div>
  );
}
