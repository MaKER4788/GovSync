import type { Metadata } from "next";
import Link from "next/link";
import {
  CircleHelp,
  FileQuestion,
  Keyboard,
  ListChecks,
  MessageSquare,
  PlayCircle,
  Route,
  ShieldCheck,
  Timer,
} from "lucide-react";

import { PageHeader, SectionHeading } from "@/components/govsync/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { applicationById } from "@/lib/data/applications";
import { requiredActions } from "@/lib/data/approvals";
import { connectedDepartments, SIMULATION } from "@/lib/data/departments";

export const metadata: Metadata = {
  title: "Help",
  description:
    "How to read the workspace: statuses, progress, actions, and what this prototype does not do.",
};

const glossary: { term: string; meaning: string }[] = [
  {
    term: "In Progress",
    meaning:
      "The application is open and at least one stage has not been decided. The current stage is named on the application.",
  },
  {
    term: "Under Review",
    meaning:
      "A departmental officer is actively examining the application. The stage clock is running.",
  },
  {
    term: "Pending",
    meaning:
      "The stage is queued behind an upstream approval. Nothing is required from the applicant, and no department has been asked for a decision yet.",
  },
  {
    term: "Action Required",
    meaning:
      "The application is waiting on a document or an answer from you. The stage does not move until you respond.",
  },
  {
    term: "Blocked",
    meaning:
      "An upstream stage has not issued, so this stage cannot start. The applicant is told what it is waiting on rather than being left with a silent wait.",
  },
  {
    term: "Approved",
    meaning:
      "A department has decided. Its outputs are published to the shared record and forwarded to every downstream consumer.",
  },
  {
    term: "Completed",
    meaning:
      "Every stage is approved and the final document is in your vault. The record stays in the applications list.",
  },
];

const faqs: { question: string; answer: string }[] = [
  {
    question: "Why does my application show a percentage below half done?",
    answer:
      "Progress is the average completion of every stage, including work already done on stages that are still queued. A stage that is 80% prepared but cannot start yet still counts 80%, because that preparation is real and it is why the application is not starting from zero.",
  },
  {
    question: "A stage says Pending. Do I need to do anything?",
    answer:
      "No. Pending means an earlier department has not finished, so this stage has not been sent anywhere yet. You will be notified the moment it becomes your stage to watch.",
  },
  {
    question: "Do I have to upload the same document for two departments?",
    answer:
      "No. A document is verified once by the department that owns the fact it proves. Downstream departments consume that verification through the interoperability layer instead of asking you again.",
  },
  {
    question: "Can I edit an application after filing it?",
    answer:
      "Not in this prototype. Amending a filed application is handled through a change request to the owning department, which is not part of this build.",
  },
  {
    question: "What happens if I miss a demo deadline?",
    answer:
      "The stage stays in Action Required and the workflow engine keeps holding it. In a production deployment the department would apply its own escalation policy. Deadlines in this build are demonstration values, not statutory ones.",
  },
  {
    question: "Is any of this connected to a real government system?",
    answer:
      `No. Every departmental system in this build is simulated and labelled ${SIMULATION.connectionLabel}. Data is frozen at ${SIMULATION.frozenAt} so the same figures appear on every visit.`,
  },
];

export default function HelpPage() {
  const actions = requiredActions();
  const primary = applicationById("GS-2026-00142");

  return (
    <div>
      <PageHeader
        eyebrow="Workspace"
        title="Help"
        description="How to read this workspace: what each status means, how progress is calculated, and exactly where the prototype stops."
        crumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Help" },
        ]}
        actions={
          <Button variant="outline" disabled title="Not available in this prototype">
            <MessageSquare className="size-4" aria-hidden="true" />
            Contact support
          </Button>
        }
      />

      <div className="space-y-6 px-6 py-6 lg:px-8">
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
          <section aria-labelledby="glossary-heading">
            <Card className="h-full">
              <CardHeader>
                <SectionHeading
                  title="Status glossary"
                  description="Every status is shown as an icon and a word, so colour is never the only signal."
                />
              </CardHeader>
              <CardContent>
                <dl className="divide-y divide-border-subtle">
                  {glossary.map((entry) => (
                    <div key={entry.term} className="py-3 first:pt-0 last:pb-0">
                      <dt className="text-sm font-semibold text-foreground">
                        {entry.term}
                      </dt>
                      <dd className="mt-1 text-xs leading-relaxed text-muted">
                        {entry.meaning}
                      </dd>
                    </div>
                  ))}
                </dl>
              </CardContent>
            </Card>
          </section>

          <div className="space-y-6">
            <section aria-labelledby="progress-heading">
              <Card>
                <CardHeader>
                  <SectionHeading
                    title="How progress is calculated"
                    description="The number on the dashboard, in one place."
                  />
                </CardHeader>
                <CardContent className="space-y-3 text-xs leading-relaxed text-muted">
                  <p>
                    Progress is the mean completion of every stage on the application.
                    An approved stage is always 100%. A queued stage keeps whatever
                    preparation work has already been recorded against it, because
                    that work is what the platform has actually done so far.
                  </p>
                  {primary ? (
                    <p className="rounded-md border border-border-subtle bg-surface-2/40 p-3 font-mono text-[11px] leading-relaxed text-muted-2">
                      {primary.approvals
                        .map((approval) => approval.completion)
                        .join(" + ")}{" "}
                      &divide; {primary.approvals.length} ={" "}
                      <span className="text-foreground">
                        {Math.round(
                          primary.approvals.reduce(
                            (total, approval) => total + approval.completion,
                            0,
                          ) / primary.approvals.length,
                        )}
                        %
                      </span>{" "}
                      on {primary.id}
                    </p>
                  ) : null}
                  <p>
                    Progress is not a forecast of completion. A stage under review
                    can stay at the same figure for its whole SLA window, and the
                    application can still be issued on time.
                  </p>
                </CardContent>
              </Card>
            </section>

            <section aria-labelledby="waiting-heading">
              <Card>
                <CardHeader>
                  <SectionHeading
                    title="What is waiting on you"
                    description={`${actions.length} open items across your applications.`}
                  />
                </CardHeader>
                <CardContent>
                  {actions.length > 0 ? (
                    <ul className="space-y-2">
                      {actions.map((entry) => (
                        <li
                          key={`${entry.applicationId}-${entry.approvalTitle}`}
                          className="rounded-md border border-border-subtle bg-surface-2/30 p-3"
                        >
                          <p className="text-xs font-medium text-foreground">
                            {entry.action.item}
                          </p>
                          <p className="mt-1 text-[11px] text-muted-2">
                            {entry.applicationId} &middot; {entry.approvalTitle} &middot;
                            demo deadline {entry.action.deadline}
                          </p>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-muted">
                      Nothing is waiting on you right now.
                    </p>
                  )}
                  <Button asChild variant="outline" size="sm" className="mt-3 w-full">
                    <Link href="/approvals#actions">
                      <ListChecks className="size-3.5" aria-hidden="true" />
                      Go to approvals
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </section>
          </div>
        </div>

        <section aria-labelledby="faq-heading">
          <Card>
            <CardHeader>
              <SectionHeading
                title="Common questions"
                description="The questions this workspace is most likely to raise."
              />
            </CardHeader>
            <CardContent>
              <dl className="divide-y divide-border-subtle">
                {faqs.map((entry) => (
                  <div key={entry.question} className="py-3.5 first:pt-0 last:pb-0">
                    <dt className="flex items-start gap-2 text-sm font-semibold text-foreground">
                      <FileQuestion
                        className="mt-0.5 size-3.5 shrink-0 text-muted-2"
                        aria-hidden="true"
                      />
                      {entry.question}
                    </dt>
                    <dd className="mt-1.5 pl-5.5 text-xs leading-relaxed text-muted">
                      {entry.answer}
                    </dd>
                  </div>
                ))}
              </dl>
            </CardContent>
          </Card>
        </section>

        <section aria-labelledby="limits-heading">
          <Card>
            <CardHeader>
              <SectionHeading
                title="What this prototype does not do"
                description="Stated plainly, so nothing here is mistaken for a working service."
              />
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {(
                [
                  [
                    PlayCircle,
                    "No filing or payment",
                    "Starting an application shows the service catalogue only. No form is submitted and no payment is taken.",
                  ],
                  [
                    ShieldCheck,
                    "No live connections",
                    `Departmental systems are simulated and labelled ${SIMULATION.connectionLabel}. No request leaves the browser.`,
                  ],
                  [
                    Keyboard,
                    "No real authentication",
                    "The Demo User identity is fixed. There is no sign-in, no session and no credential anywhere in the build.",
                  ],
                  [
                    CircleHelp,
                    "Nothing is stored",
                    "Uploads, approvals and notification preferences are all disabled. Data is frozen so figures stay consistent between visits.",
                  ],
                ] as const
              ).map(([Icon, title, body]) => (
                <div
                  key={title}
                  className="rounded-lg border border-border bg-surface-2/30 p-4"
                >
                  <Icon className="size-4 text-accent" aria-hidden="true" />
                  <h3 className="mt-2.5 text-xs font-semibold text-foreground">{title}</h3>
                  <p className="mt-1.5 text-[11px] leading-relaxed text-muted">{body}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>

        <Card>
          <CardContent className="px-6 py-5">
            <SectionHeading
              title="Where to go next"
              description="Each of these pages is live in this build and reads the same records."
            />
            <div className="mt-4 flex flex-wrap gap-2">
              {(
                [
                  ["/dashboard", "Dashboard", "The four key figures and everything waiting on you"],
                  ["/applications", "Applications", "Every application, active and completed"],
                  ["/approvals", "Approvals", "Open stages and required actions"],
                  ["/documents", "Documents", "The shared document vault"],
                  ["/notifications", "Notifications", "The full notice feed"],
                  ["/workflow", "Workflow", "Dependencies, lanes and SLA detail"],
                  ["/integration", "Integration", `${connectedDepartments.length} simulated departmental systems`],
                  ["/settings", "Settings", "Identity, consent and environment"],
                ] as const
              ).map(([href, label, description]) => (
                <Link
                  key={href}
                  href={href}
                  className="group flex min-w-56 flex-1 flex-col rounded-md border border-border bg-surface-2/30 p-3 transition-colors hover:border-border-strong"
                >
                  <span className="flex items-center gap-1.5 text-xs font-medium text-foreground">
                    <Route
                      className="size-3 text-muted-2 group-hover:text-accent"
                      aria-hidden="true"
                    />
                    {label}
                  </span>
                  <span className="mt-1 text-[11px] leading-relaxed text-muted-2">
                    {description}
                  </span>
                </Link>
              ))}
            </div>
            <p className="mt-4 flex items-center gap-2 text-[11px] text-muted-2">
              <Timer className="size-3.5" aria-hidden="true" />
              Figures on this page were generated against the frozen simulation clock
              at {SIMULATION.frozenAt}. All references are fictional.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
