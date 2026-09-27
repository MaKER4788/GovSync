import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowUpRight,
  FileText,
  FolderOpen,
  ShieldCheck,
  Upload,
} from "lucide-react";

import { KeyFigure } from "@/components/govsync/metric-card";
import { PageHeader, SectionHeading } from "@/components/govsync/page-header";
import { StatusBadge } from "@/components/govsync/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  allDocuments,
  documentCategories,
  documentSummary,
} from "@/lib/data/documents";
import { formatDate, formatStamp } from "@/lib/format";

export const metadata: Metadata = {
  title: "Documents",
  description:
    "The shared document vault: what this identity has uploaded, which department verified it and what is still being checked.",
};

export default function DocumentsPage() {
  const summary = documentSummary();
  const categories = documentCategories();
  const documents = allDocuments();

  return (
    <div>
      <PageHeader
        eyebrow="Workspace"
        title="Documents"
        description="One vault, shared by every department working on your applications. A document verified once is never requested twice."
        crumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Documents" },
        ]}
        actions={
          <Button variant="secondary" disabled title="Not available in this prototype">
            <Upload className="size-4" aria-hidden="true" />
            Upload document
          </Button>
        }
      />

      <div className="space-y-6 px-6 py-6 lg:px-8">
        <section aria-labelledby="counts-heading">
          <h2 id="counts-heading" className="sr-only">
            Document counts
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <KeyFigure
              label="Documents in vault"
              value={String(summary.total)}
              hint="Across every application on this identity"
            />
            <KeyFigure
              label="Verified"
              value={String(summary.verified)}
              hint="Checked by a department and reusable"
            />
            <KeyFigure
              label="Awaiting review"
              value={String(summary.awaitingReview)}
              hint="Uploaded, not yet checked"
            />
            <KeyFigure
              label="Rejected"
              value={String(summary.rejected)}
              hint="Superseded by a corrected version"
            />
          </div>
        </section>

        <section aria-labelledby="vault-heading">
          <Card>
            <CardHeader>
              <SectionHeading
                title="Document vault"
                description="Most recent first. Verification is attributed to a named department, not to a person."
              />
            </CardHeader>
            <CardContent className="px-0 py-0">
              <div className="hidden lg:block">
                <Table>
                  <caption className="sr-only">
                    Documents uploaded across all applications, with verification status
                  </caption>
                  <TableHeader>
                    <TableRow>
                      <TableHead scope="col">Document</TableHead>
                      <TableHead scope="col">Application</TableHead>
                      <TableHead scope="col">Category</TableHead>
                      <TableHead scope="col">Uploaded</TableHead>
                      <TableHead scope="col">Verified by</TableHead>
                      <TableHead scope="col">Status</TableHead>
                      <TableHead scope="col" className="text-right">
                        <span className="sr-only">Open</span>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {documents.map((document) => (
                      <TableRow key={`${document.applicationId}-${document.id}`}>
                        <TableCell>
                          <span className="flex items-start gap-2">
                            <FileText
                              className="mt-0.5 size-3.5 shrink-0 text-muted-2"
                              aria-hidden="true"
                            />
                            <span className="min-w-0">
                              <span className="block text-sm font-medium text-foreground">
                                {document.name}
                              </span>
                              <span className="mt-1 block font-mono text-[11px] text-muted-2">
                                {document.id} &middot;{" "}
                                {document.sizeKb.toLocaleString("en-IN")} KB
                              </span>
                            </span>
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="block font-mono text-[11px] text-accent">
                            {document.applicationId}
                          </span>
                          <span className="mt-1 block max-w-56 truncate text-[11px] text-muted-2">
                            {document.applicationTitle}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-xs text-muted">
                            {document.category}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-xs text-muted tabular">
                            {formatDate(document.uploadedAt)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="block text-xs text-foreground">
                            {document.verifiedBy}
                          </span>
                          <span className="mt-1 block text-[11px] text-muted-2">
                            {document.origin}
                          </span>
                        </TableCell>
                        <TableCell>
                          <StatusBadge kind="document" value={document.status} />
                        </TableCell>
                        <TableCell className="text-right">
                          <Link
                            href={`/applications/${document.applicationId}`}
                            className="inline-flex items-center gap-1 text-xs font-medium text-accent transition-colors hover:text-foreground"
                          >
                            View
                            <ArrowUpRight className="size-3.5" aria-hidden="true" />
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <ul className="divide-y divide-border-subtle lg:hidden">
                {documents.map((document) => (
                  <li key={`${document.applicationId}-${document.id}`} className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground">
                          {document.name}
                        </p>
                        <p className="mt-1 font-mono text-[11px] text-muted-2">
                          {document.id} &middot; {document.category}
                        </p>
                      </div>
                      <StatusBadge kind="document" value={document.status} />
                    </div>
                    <p className="mt-2 text-[11px] text-muted-2">
                      {document.applicationId} &middot; {document.applicationTitle}
                    </p>
                    <p className="mt-1 text-[11px] text-muted-2">
                      Uploaded {formatStamp(document.uploadedAt)} &middot; verified by{" "}
                      {document.verifiedBy}
                    </p>
                    <Link
                      href={`/applications/${document.applicationId}`}
                      className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-accent"
                    >
                      View application
                      <ArrowUpRight className="size-3.5" aria-hidden="true" />
                    </Link>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </section>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
          <section aria-labelledby="categories-heading">
            <Card className="h-full">
              <CardHeader>
                <SectionHeading
                  title="By category"
                  description="What this identity has on file, grouped by document type."
                />
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {categories.map((category) => {
                    const share = Math.round(
                      (category.count / Math.max(1, summary.total)) * 100,
                    );
                    return (
                      <li key={category.name}>
                        <div className="flex items-baseline justify-between gap-3 text-xs">
                          <span className="inline-flex items-center gap-2 text-foreground">
                            <FolderOpen
                              className="size-3.5 shrink-0 text-muted-2"
                              aria-hidden="true"
                            />
                            {category.name}
                          </span>
                          <span className="text-muted tabular">
                            {category.count} &middot; {share}%
                          </span>
                        </div>
                        <div
                          className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-surface-3"
                          role="img"
                          aria-label={`${category.name}: ${category.count} of ${summary.total} documents`}
                        >
                          <div
                            className="h-full rounded-full bg-primary"
                            style={{ width: `${share}%` }}
                          />
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </CardContent>
            </Card>
          </section>

          <section aria-labelledby="sharing-heading">
            <Card className="h-full">
              <CardHeader>
                <SectionHeading
                  title="How the vault is shared"
                  description="Why a document is uploaded once and consumed by several departments."
                />
              </CardHeader>
              <CardContent className="space-y-3 text-xs leading-relaxed text-muted">
                <p className="flex items-start gap-2.5">
                  <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-accent" aria-hidden="true" />
                  A document is verified once by the department that owns the fact it
                  proves. Downstream departments consume that verification through the
                  interoperability layer instead of re-checking it, which is why the
                  same file is never requested a second time.
                </p>
                <p className="flex items-start gap-2.5">
                  <FileText className="mt-0.5 size-3.5 shrink-0 text-accent" aria-hidden="true" />
                  Consent for departmental sharing is recorded when the application is
                  filed. Each department only sees the documents its own stage
                  requires.
                </p>
                <p className="flex items-start gap-2.5">
                  <Upload className="mt-0.5 size-3.5 shrink-0 text-accent" aria-hidden="true" />
                  Uploading is disabled in this prototype. The vault below is a
                  simulated record set; no file is stored, transmitted or retained.
                </p>
              </CardContent>
            </Card>
          </section>
        </div>
      </div>
    </div>
  );
}
