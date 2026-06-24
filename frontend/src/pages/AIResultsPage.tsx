import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, CheckCircle2, FileSearch, Gauge, ScanSearch } from "lucide-react";
import { LoadingState } from "@/components/LoadingState";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { useClaims } from "@/hooks/useClaims";
import { Claim, ClaimDocument } from "@/types";
import { classifyUpload } from "@/utils/documentAI";
import { resolveEvidencePreviewUrl } from "@/utils/evidencePreview";
import { isImageDocument, isPdfDocument, isVideoDocument } from "@/utils/claimAccess";

function docConfidence(doc: ClaimDocument): number {
  if (doc.confidenceScore != null) {
    return doc.confidenceScore;
  }
  return classifyUpload(doc.name, doc.kind).confidenceScore;
}

function pickDefaultClaimId(claims: Claim[]): string {
  if (!claims.length) {
    return "";
  }
  const sorted = [...claims].sort((a, b) => b.documents.length - a.documents.length);
  return (sorted.find((claim) => claim.documents.length > 0) ?? sorted[0]).id;
}

function confidenceTone(value: number): string {
  if (value >= 85) {
    return "text-emerald-700 bg-emerald-50 border-emerald-200";
  }
  if (value >= 65) {
    return "text-amber-800 bg-amber-50 border-amber-200";
  }
  return "text-rose-800 bg-rose-50 border-rose-200";
}

function DocumentResultCard({ claim, doc }: { claim: Claim; doc: ClaimDocument }) {
  const confidence = docConfidence(doc);
  const previewUrl = resolveEvidencePreviewUrl(claim.id, doc);
  const kindLabel = isImageDocument(doc)
    ? "Photo"
    : isVideoDocument(doc)
      ? "Video"
      : isPdfDocument(doc)
        ? "PDF"
        : "Document";

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex gap-4">
        <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
          {previewUrl && isImageDocument(doc) ? (
            <img src={previewUrl} alt={doc.name} className="h-full w-full object-cover" />
          ) : (
            <div className="grid h-full place-items-center text-xs font-semibold text-slate-500">{kindLabel}</div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-navy-900">{doc.name}</p>
          <p className="mt-1 text-sm text-slate-500">
            {doc.documentType ?? kindLabel} · {new Date(doc.uploadedAt).toLocaleDateString("en-GB")}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className={`rounded-full border px-2.5 py-0.5 text-xs font-bold ${confidenceTone(confidence)}`}>
              OCR {confidence}%
            </span>
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                doc.aiStatus === "Valid"
                  ? "bg-emerald-100 text-emerald-800"
                  : doc.aiStatus === "Flagged"
                    ? "bg-rose-100 text-rose-800"
                    : "bg-slate-100 text-slate-600"
              }`}
            >
              {doc.aiStatus}
            </span>
          </div>
          {doc.reviewNote ? <p className="mt-2 text-xs text-slate-500">{doc.reviewNote}</p> : null}
        </div>
      </div>
    </div>
  );
}

export const AIResultsPage = () => {
  const { data: claims = [], isLoading } = useClaims();
  const [claimId, setClaimId] = useState("");

  useEffect(() => {
    if (!claims.length) {
      return;
    }
    setClaimId((prev) => (prev && claims.some((claim) => claim.id === prev) ? prev : pickDefaultClaimId(claims)));
  }, [claims]);

  const claim = useMemo(
    () => claims.find((item) => item.id === claimId) ?? claims[0],
    [claims, claimId]
  );

  const docs = claim?.documents ?? [];
  const avgConfidence =
    docs.length > 0 ? Math.round(docs.reduce((sum, doc) => sum + docConfidence(doc), 0) / docs.length) : 0;
  const flaggedCount = docs.filter((doc) => doc.aiStatus === "Flagged").length;
  const validCount = docs.filter((doc) => doc.aiStatus === "Valid").length;
  const claimsWithDocs = claims.filter((item) => item.documents.length > 0).length;

  if (isLoading) {
    return <LoadingState label="Loading AI verification results..." />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="AI verification"
        title="OCR and AI document results"
        description="Review OCR confidence, validation status, and AI notes for each uploaded document on a claim."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="card p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Claims with evidence</p>
          <p className="mt-2 text-3xl font-bold text-navy-900">{claimsWithDocs}</p>
          <p className="mt-1 text-sm text-slate-500">of {claims.length} total claims</p>
        </div>
        <div className="card p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Avg OCR confidence</p>
          <p className="mt-2 text-3xl font-bold text-navy-900">{docs.length ? `${avgConfidence}%` : "—"}</p>
          <p className="mt-1 text-sm text-slate-500">{docs.length} files on selected claim</p>
        </div>
        <div className="card p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Valid documents</p>
          <p className="mt-2 text-3xl font-bold text-emerald-700">{validCount}</p>
          <p className="mt-1 text-sm text-slate-500">AI marked as valid</p>
        </div>
        <div className="card p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Flagged for review</p>
          <p className="mt-2 text-3xl font-bold text-rose-700">{flaggedCount}</p>
          <p className="mt-1 text-sm text-slate-500">Needs officer attention</p>
        </div>
      </div>

      <div className="card p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-700">Select claim</p>
            <p className="mt-1 text-xs text-slate-500">
              Claims with uploaded evidence are listed first. Pick a claim to inspect each document.
            </p>
          </div>
          <select
            className="input max-w-xl lg:min-w-[22rem]"
            value={claim?.id ?? ""}
            onChange={(event) => setClaimId(event.target.value)}
          >
            {[...claims]
              .sort((a, b) => b.documents.length - a.documents.length)
              .map((item) => (
                <option key={item.id} value={item.id}>
                  {item.id} — {item.claimantName} ({item.documents.length} files)
                </option>
              ))}
          </select>
        </div>
      </div>

      {claim ? (
        <div className="card overflow-hidden">
          <div className="border-b border-slate-200 bg-gradient-to-r from-slate-50 to-emerald-50/40 px-6 py-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-prime-700">Selected claim</p>
                <h2 className="mt-1 text-xl font-bold text-navy-900">
                  {claim.id} · {claim.claimantName}
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  {claim.policyNumber} · {claim.type} · {claim.region}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status={claim.status} />
                <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-200">
                  Risk {claim.riskScore}
                </span>
              </div>
            </div>
          </div>

          <div className="grid gap-6 p-6 xl:grid-cols-[1fr_1.2fr]">
            <div className="space-y-4">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <div className="flex items-center gap-2 text-sm font-semibold text-navy-900">
                  <Gauge className="h-4 w-4 text-prime-600" />
                  AI claim summary
                </div>
                <p className="mt-3 text-sm leading-relaxed text-slate-700">{claim.aiSummary}</p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 p-4 text-center">
                  <ScanSearch className="mx-auto h-5 w-5 text-prime-600" />
                  <p className="mt-2 text-xs text-slate-500">OCR confidence</p>
                  <p className="text-xl font-bold text-navy-900">{docs.length ? `${avgConfidence}%` : "—"}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 p-4 text-center">
                  <CheckCircle2 className="mx-auto h-5 w-5 text-emerald-600" />
                  <p className="mt-2 text-xs text-slate-500">Valid files</p>
                  <p className="text-xl font-bold text-navy-900">{validCount}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 p-4 text-center">
                  <AlertTriangle className="mx-auto h-5 w-5 text-rose-600" />
                  <p className="mt-2 text-xs text-slate-500">Flagged</p>
                  <p className="text-xl font-bold text-navy-900">{flaggedCount}</p>
                </div>
              </div>

              <Link to={`/claims/${claim.id}`} className="btn-primary inline-flex">
                Open claim workspace
              </Link>
            </div>

            <div>
              <p className="mb-3 text-sm font-semibold text-slate-700">Document results</p>
              {docs.length ? (
                <div className="space-y-3">
                  {docs.map((doc) => (
                    <DocumentResultCard key={doc.id} claim={claim} doc={doc} />
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                  <FileSearch className="mx-auto h-10 w-10 text-slate-400" />
                  <p className="mt-3 font-semibold text-navy-900">No documents on this claim</p>
                  <p className="mt-2 text-sm text-slate-500">
                    This claim has no uploaded evidence yet. Choose another claim from the list above, or open the
                    claim workspace to request documents from the claimant.
                  </p>
                  <div className="mt-5 flex flex-wrap justify-center gap-3">
                    <Link to="/verification" className="btn-secondary">
                      Verification queue
                    </Link>
                    <Link to={`/claims/${claim.id}`} className="btn-primary">
                      Open claim
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="card p-8 text-center text-sm text-slate-500">No claims available yet.</div>
      )}
    </div>
  );
};
