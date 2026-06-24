import { useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { Download, FileDown } from "lucide-react";
import { ClaimEvidenceGallery } from "@/components/evidence/ClaimEvidenceGallery";
import { EmptyState } from "@/components/EmptyState";
import { useAuth } from "@/hooks/useAuth";
import { LoadingState } from "@/components/LoadingState";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { ClaimActionButtons } from "@/components/claims/ClaimActionButtons";
import { ClaimManageActions } from "@/components/claims/ClaimManageActions";
import { useClaim } from "@/hooks/useClaims";
import { downloadStoredEvidence } from "@/services/backend";
import { userOwnsClaim } from "@/utils/claimAccess";
import { formatDate } from "@/utils/format";
import { generateClaimDossierPdf } from "@/utils/pdfReport";
import { assessClaim } from "@/utils/claimAssessment";

export const ClaimDetailPage = () => {
  const { claimId = "" } = useParams();
  const { data: claim, isLoading, isError } = useClaim(claimId);
  const { user } = useAuth();
  const assessment = useMemo(() => (claim ? assessClaim(claim) : null), [claim]);

  if (isLoading) {
    return <LoadingState label="Loading claim workspace..." />;
  }

  if (isError || !claim) {
    return (
      <div className="space-y-4">
        <EmptyState
          title="Claim not available"
          description="This claim does not exist or you can only view your own claims."
        />
        <Link to="/tracking" className="btn-primary inline-flex">
          Back to my claims
        </Link>
      </div>
    );
  }

  if (!userOwnsClaim(claim, user)) {
    return (
      <div className="space-y-4">
        <EmptyState
          title="Access restricted"
          description="You can only view claims filed under your account name."
        />
        <Link to="/" className="btn-primary inline-flex">
          Go to dashboard
        </Link>
      </div>
    );
  }

  const isClaimant = user?.role === "claimant";
  const canEvaluate = user?.role === "officer" || user?.role === "supervisor" || user?.role === "admin";
  const canInvestigate = user?.role === "fraud-investigator" || user?.role === "supervisor" || user?.role === "admin";
  const canExportPdf = canEvaluate || canInvestigate || isClaimant;

  const exportClaimPdf = async () => {
    try {
      await generateClaimDossierPdf(claim, {
        title: `Claim dossier — ${claim.id}`,
        generatedBy: user?.name ?? "System user",
        generatedByRole: user?.role,
        generatedAt: new Date()
      });
      toast.success("Claim PDF downloaded.");
    } catch {
      toast.error("Could not generate PDF.");
    }
  };

  return (
    <div className="space-y-6">
      {isClaimant ? (
        <div className="card border-prime-200 bg-prime-50/60 p-5 space-y-4">
          <div>
            <p className="font-semibold text-slate-900">Manage your claim</p>
            <p className="mt-1 text-sm text-slate-600">
              Edit or delete while the claim is still Draft, Pending, or Under Review. Upload extra evidence anytime.
            </p>
            <div className="mt-4">
              <ClaimManageActions claim={claim} />
            </div>
          </div>
          <div className="border-t border-prime-200/80 pt-4">
            <p className="font-semibold text-slate-900">Officer may request more documents</p>
            <p className="mt-1 text-sm text-slate-600">
              Upload photos (damage, garage) or PDFs. Files are attached to this claim and visible to the officer.
            </p>
            <Link to={`/evidence/upload?claimId=${encodeURIComponent(claim.id)}`} className="btn-primary mt-4 inline-flex">
              Add more photos / PDFs
            </Link>
          </div>
        </div>
      ) : null}
      <PageHeader
        eyebrow="Claim Evaluation Workspace"
        title={`${claim.id} · ${claim.claimantName}`}
        description="Review full claim detail, evidence, internal notes, and decision history from one evaluation surface."
        actions={
          <div className="flex flex-wrap items-center gap-3">
            <StatusBadge status={claim.status} />
            {canExportPdf ? (
              <>
                <button type="button" className="btn-secondary inline-flex items-center gap-2" onClick={exportClaimPdf}>
                  <FileDown className="h-4 w-4" />
                  Export PDF report
                </button>
                <Link
                  to={`/reports?report=claim&claimId=${encodeURIComponent(claim.id)}`}
                  className="btn-secondary inline-flex items-center gap-2"
                >
                  Pick report type
                </Link>
              </>
            ) : null}
          </div>
        }
      />
      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-6">
          <div className="card p-6">
            <h3 className="text-xl font-bold text-slate-900">
              {isClaimant ? "My evidence" : "Claimant evidence"}
            </h3>
            <p className="mt-1 text-sm text-slate-600">
              {isClaimant
                ? "Photos and documents you uploaded are stored here and shared with the reviewing officer."
                : "All images and PDFs uploaded by the claimant for this claim."}
            </p>
            <div className="mt-4">
              <ClaimEvidenceGallery
                claimId={claim.id}
                claimType={claim.type}
                documents={claim.documents}
                title={isClaimant ? "All your uploaded photos" : "All claimant photos & files"}
                emptyMessage="No evidence files attached yet."
                manageable={isClaimant}
              />
            </div>
            {!isClaimant && claim.documents.some((d) => d.storageKey) ? (
              <div className="mt-6 space-y-3">
                {claim.documents
                  .filter((d) => d.storageKey)
                  .map((document) => (
                    <div
                      key={`dl-${document.id}`}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-slate-200 px-4 py-3"
                    >
                      <div>
                        <p className="font-semibold text-slate-900">{document.name}</p>
                        <p className="text-sm text-slate-500">
                          {document.kind.toUpperCase()} · {formatDate(document.uploadedAt)}
                        </p>
                      </div>
                      <button
                        type="button"
                        className="btn-secondary gap-2"
                        onClick={() => {
                          void downloadStoredEvidence(claim.id, document.id, document.name).catch(() =>
                            toast.error("Download failed. Sign in and try again.")
                          );
                        }}
                      >
                        <Download className="h-4 w-4" />
                        Download
                      </button>
                    </div>
                  ))}
              </div>
            ) : null}
          </div>
          <div className="card p-6">
            <h3 className="text-xl font-bold text-slate-900">Decision history</h3>
            <div className="mt-4 space-y-4">
              {claim.timeline.map((entry) => (
                <div key={entry.id} className="rounded-2xl bg-slate-50 p-4">
                  <p className="font-semibold text-slate-900">{entry.label}</p>
                  <p className="text-sm text-slate-500">{entry.actor} · {formatDate(entry.at)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="space-y-6">
          <div className="card p-6">
            <h3 className="text-xl font-bold text-slate-900">AI & fraud assessment</h3>
            <p className="mt-1 text-xs text-slate-500">Calculated from document compliance, AI confidence, and flagged evidence.</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl bg-amber-50 p-4 ring-1 ring-amber-100">
                <p className="text-xs font-semibold uppercase tracking-wide text-amber-800">Verification</p>
                <p className="mt-1 text-2xl font-bold text-slate-900">
                  {assessment?.verificationPercent ?? 0}
                  <span className="text-sm font-medium text-slate-500">%</span>
                </p>
                <p className="mt-1 text-sm font-semibold capitalize text-slate-900">{assessment?.verificationStatus ?? "—"}</p>
                <p className="mt-1 text-xs text-slate-600">
                  Document compliance: {assessment?.completenessPercent ?? 0}% · AI confidence:{" "}
                  {assessment?.confidencePercent ?? 0}%
                </p>
              </div>
              <div className="rounded-2xl bg-blue-50 p-4 ring-1 ring-blue-100">
                <p className="text-xs font-semibold uppercase tracking-wide text-blue-800">Fraud risk score</p>
                <p className="mt-1 text-2xl font-bold text-slate-900">
                  {assessment?.fraudRiskScore ?? claim.riskScore}
                  <span className="text-sm font-medium text-slate-500"> / 100</span>
                </p>
                <p className="mt-1 text-xs font-semibold text-slate-700">{assessment?.riskBand ?? "—"} risk</p>
                <p className="mt-1 text-xs text-slate-600">{assessment?.riskLabel ?? "—"}</p>
              </div>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-slate-600">{assessment?.summary ?? claim.aiSummary}</p>
            {assessment?.factors.length ? (
              <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Risk factors</p>
                <ul className="mt-2 space-y-2">
                  {assessment.factors.map((factor) => (
                    <li key={factor.label} className="flex items-start justify-between gap-3 text-sm">
                      <div>
                        <p className="font-medium text-slate-800">{factor.label}</p>
                        <p className="text-xs text-slate-500">{factor.detail}</p>
                      </div>
                      <span className="shrink-0 rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">
                        +{factor.impact}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            <div className="mt-4 space-y-2">
              {claim.documents.map((doc) => (
                <div key={doc.id} className="flex justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2 text-sm">
                  <div className="min-w-0">
                    <span className="font-medium text-slate-800">{doc.documentType ?? doc.name}</span>
                    {doc.confidenceScore != null ? (
                      <p className="text-xs text-slate-500">AI confidence: {doc.confidenceScore}%</p>
                    ) : null}
                  </div>
                  <span className={doc.aiStatus === "Valid" ? "text-emerald-700" : "text-amber-700"}>{doc.aiStatus}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="card p-6">
            <h3 className="text-xl font-bold text-slate-900">Officer decision</h3>
            <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
              <div>Assigned team: <span className="font-semibold text-slate-900">{claim.assignedTeam}</span></div>
              <div className="mt-2">Assigned officer: <span className="font-semibold text-slate-900">{claim.assignedOfficer}</span></div>
            </div>
            <div className="mt-6">
              {canEvaluate ? <ClaimActionButtons claim={claim} showInvestigate={canInvestigate} showOpenLink={false} /> : null}
              {!canEvaluate && canInvestigate ? (
                <ClaimActionButtons claim={claim} showInvestigate layout="stack" showOpenLink={false} />
              ) : null}
            </div>
          </div>
          <div className="card p-6">
            <h3 className="text-xl font-bold text-slate-900">Notes and chat</h3>
            <div className="mt-4 space-y-3">
              <div className="rounded-2xl bg-prime-50 p-4 text-sm text-slate-700">Officer note: repair invoice details exceed usual benchmark — verify line items.</div>
              <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">Supervisor note: verify vendor against approved garage list.</div>
              <textarea className="input min-h-28" placeholder="Leave an internal note..." />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
