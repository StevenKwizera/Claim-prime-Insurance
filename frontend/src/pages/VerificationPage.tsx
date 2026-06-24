import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ClaimActionButtons } from "@/components/claims/ClaimActionButtons";
import { ClaimQueueList } from "@/components/claims/ClaimQueueList";
import { ClaimTypeFilterTabs } from "@/components/claims/ClaimTypeFilterTabs";
import { AiExplanationPanel } from "@/components/AiExplanationPanel";
import { PageHeader } from "@/components/PageHeader";
import { TamperingAlertsPanel } from "@/components/TamperingAlertsPanel";
import { useClaims } from "@/hooks/useClaims";
import { Claim } from "@/types";
import { ClaimTypeFilter, filterClaimsByType, sortClaimsNewestFirst } from "@/utils/claimGrouping";

type ViewScope = "queue" | "all";

export const VerificationPage = () => {
  const { data: claims = [] } = useClaims();
  const [scope, setScope] = useState<ViewScope>("all");
  const [typeFilter, setTypeFilter] = useState<ClaimTypeFilter>("all");

  const pool = useMemo(() => {
    const sorted = sortClaimsNewestFirst(claims);
    if (scope === "queue") {
      return sorted.filter((c) => ["Pending", "Under Review", "Investigation"].includes(c.status));
    }
    return sorted;
  }, [claims, scope]);

  const visible = useMemo(() => filterClaimsByType(pool, typeFilter), [pool, typeFilter]);

  const [selected, setSelected] = useState<Claim | null>(null);
  const active = selected ?? visible[0] ?? null;
  const flaggedDocument = active?.documents.find((doc) => doc.aiStatus === "Flagged") ?? active?.documents[0];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Verification Dashboard"
        title="Review documents and resolve exceptions"
        description="Officers can browse all claims or focus on the review queue, filtered by Motor, Health, or Property."
        actions={
          <Link to="/verification/all-claims" className="btn-secondary">
            Full claims table
          </Link>
        }
      />

      <div className="flex flex-wrap items-center gap-3">
        <div className="inline-flex rounded-full bg-slate-100 p-1">
          <button
            type="button"
            className={`rounded-full px-4 py-2 text-sm font-semibold ${scope === "all" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600"}`}
            onClick={() => setScope("all")}
          >
            All claims ({claims.length})
          </button>
          <button
            type="button"
            className={`rounded-full px-4 py-2 text-sm font-semibold ${scope === "queue" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600"}`}
            onClick={() => setScope("queue")}
          >
            Review queue
          </button>
        </div>
        <ClaimTypeFilterTabs claims={pool} value={typeFilter} onChange={setTypeFilter} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_0.95fr]">
        <ClaimQueueList
          claims={visible}
          selectedId={active?.id}
          onSelect={setSelected}
          emptyLabel={scope === "queue" ? "No claims waiting for verification." : "No claims in the system."}
          showTypeFilter={false}
        />
        <div className="card p-6">
          <h3 className="text-xl font-bold text-navy-900">Document preview</h3>
          {active ? (
            <>
              <div className="mt-4 rounded-3xl border border-dashed border-prime-200 bg-prime-50/40 p-8">
                <p className="font-semibold text-navy-900">{flaggedDocument?.name ?? "No documents"}</p>
                <p className="mt-2 text-sm text-slate-600">
                  Type: {flaggedDocument?.documentType ?? flaggedDocument?.tag ?? "—"}
                </p>
                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  <div className="rounded-2xl bg-white p-4 shadow-sm">
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-400">OCR confidence</p>
                    <p className="mt-2 text-2xl font-bold text-navy-900">{flaggedDocument?.confidenceScore ?? 96}%</p>
                  </div>
                  <div className="rounded-2xl bg-white p-4 shadow-sm">
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-400">AI status</p>
                    <p className="mt-2 text-base font-semibold text-amber-700">{flaggedDocument?.aiStatus ?? "—"}</p>
                  </div>
                  <div className="rounded-2xl bg-white p-4 shadow-sm">
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Risk score</p>
                    <p className="mt-2 text-2xl font-bold text-navy-900">{active.riskScore}</p>
                  </div>
                </div>
                {flaggedDocument?.reviewNote ? (
                  <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                    {flaggedDocument.reviewNote}
                  </div>
                ) : null}
              </div>
              <div className="mt-6">
                <ClaimActionButtons claim={active} showOpenLink />
              </div>
            </>
          ) : (
            <p className="mt-4 text-sm text-slate-500">Select a claim from the list to begin verification.</p>
          )}
        </div>
      </div>
      {active ? (
        <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <AiExplanationPanel
            claimId={active.id}
            recommendation="Review flagged documents before approval"
            confidence={flaggedDocument?.confidenceScore ?? 91}
            matchedRule="Rule VR-12: document validation checklist"
            rationale={[active.aiSummary, "Compare vendor details with policy records.", "Confirm incident date matches uploaded evidence."]}
            overrideNote="Officers may approve after missing items are uploaded."
          />
          <TamperingAlertsPanel
            claimId={active.id}
            alerts={[
              {
                title: "Document status review",
                severity: active.documents.some((d) => d.aiStatus === "Flagged") ? "High" : "Low",
                detail: active.documents.filter((d) => d.aiStatus === "Flagged").length + " flagged file(s)."
              },
              {
                title: "Missing evidence",
                severity: active.documents.some((d) => d.aiStatus === "Missing") ? "Medium" : "Low",
                detail: "Request additional uploads if required documents are incomplete."
              }
            ]}
          />
        </div>
      ) : null}
    </div>
  );
};
