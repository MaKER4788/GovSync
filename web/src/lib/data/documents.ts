import type { Application, ApplicationDocument, DocumentStatus } from "@/lib/types";
import { stampOrder } from "@/lib/format";
import { applications } from "@/lib/data/applications";

/**
 * Document view across every application, derived from the shared record set
 * so the documents route and the application detail pages cannot drift apart.
 */

export interface DocumentEntry extends ApplicationDocument {
  applicationId: string;
  applicationTitle: string;
  applicantKind: Application["applicantKind"];
}

export function allDocuments(list: Application[] = applications): DocumentEntry[] {
  return list
    .flatMap((application) =>
      application.documents.map((document) => ({
        ...document,
        applicationId: application.id,
        applicationTitle: application.title,
        applicantKind: application.applicantKind,
      })),
    )
    .sort((a, b) => stampOrder(b.uploadedAt) - stampOrder(a.uploadedAt));
}

export function documentsForApplication(
  applicationId: string,
): DocumentEntry[] {
  return allDocuments(applications.filter(
    (application) => application.id === applicationId,
  ));
}

export function countByDocumentStatus(status: DocumentStatus): number {
  return allDocuments().filter((document) => document.status === status).length;
}

export interface DocumentCategory {
  name: string;
  count: number;
}

export function documentCategories(): DocumentCategory[] {
  const totals = new Map<string, number>();
  for (const document of allDocuments()) {
    totals.set(document.category, (totals.get(document.category) ?? 0) + 1);
  }
  return Array.from(totals.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

export function documentSummary(): {
  total: number;
  verified: number;
  awaitingReview: number;
  rejected: number;
  uploadedOnce: number;
} {
  const documents = allDocuments();
  return {
    total: documents.length,
    verified: documents.filter((document) => document.status === "verified").length,
    awaitingReview: documents.filter((document) => document.status === "awaiting-review")
      .length,
    rejected: documents.filter((document) => document.status === "rejected").length,
    uploadedOnce: documents.length,
  };
}
