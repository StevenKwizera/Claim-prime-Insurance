import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { StatusBadge } from "@/components/StatusBadge";
import { ClaimTypeFilterTabs } from "@/components/claims/ClaimTypeFilterTabs";
import { Claim, ClaimType } from "@/types";
import { ClaimTypeFilter, claimTypeShortLabel, filterClaimsByType } from "@/utils/claimGrouping";

type Props = {
  claims: Claim[];
  selectedId?: string;
  onSelect: (claim: Claim) => void;
  filterStatuses?: Claim["status"][];
  emptyLabel?: string;
  showTypeFilter?: boolean;
};

export const ClaimQueueList = ({
  claims,
  selectedId,
  onSelect,
  filterStatuses,
  emptyLabel = "No claims in this queue.",
  showTypeFilter = true
}: Props) => {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<ClaimTypeFilter>("all");

  const filtered = useMemo(() => {
    return filterClaimsByType(claims, typeFilter).filter((claim) => {
      if (filterStatuses?.length && !filterStatuses.includes(claim.status)) return false;
      if (statusFilter !== "all" && claim.status !== statusFilter) return false;
      const q = query.trim().toLowerCase();
      if (!q) return true;
      return (
        claim.id.toLowerCase().includes(q) ||
        claim.claimantName.toLowerCase().includes(q) ||
        claim.policyNumber.toLowerCase().includes(q)
      );
    });
  }, [claims, filterStatuses, query, statusFilter, typeFilter]);

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white">
      {showTypeFilter ? (
        <div className="border-b border-slate-100 p-4">
          <ClaimTypeFilterTabs claims={claims} value={typeFilter} onChange={setTypeFilter} />
        </div>
      ) : null}
      <div className="flex flex-wrap gap-3 border-b border-slate-100 p-4">
        <input
          className="input max-w-xs"
          placeholder="Search ID, name, policy..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <select className="input max-w-[11rem]" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="all">All statuses</option>
          <option value="Pending">Pending</option>
          <option value="Under Review">Under Review</option>
          <option value="Investigation">Investigation</option>
          <option value="Approved">Approved</option>
          <option value="Rejected">Rejected</option>
          <option value="Draft">Draft</option>
        </select>
      </div>
      <div className="max-h-[28rem] divide-y divide-slate-100 overflow-y-auto">
        {filtered.length === 0 ? (
          <p className="p-6 text-sm text-slate-500">{emptyLabel}</p>
        ) : (
          filtered.map((claim) => (
            <button
              key={claim.id}
              type="button"
              onClick={() => onSelect(claim)}
              className={`flex w-full items-start justify-between gap-4 p-4 text-left transition hover:bg-prime-50/40 ${
                selectedId === claim.id ? "bg-prime-50/70 ring-1 ring-inset ring-prime-200" : ""
              }`}
            >
              <div>
                <p className="font-semibold text-navy-900">{claim.id}</p>
                <p className="text-sm text-slate-500">
                  {claim.claimantName} · {claim.policyNumber}
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  {claimTypeShortLabel(claim.type as ClaimType)} · Risk {claim.riskScore} · {claim.documents.length} docs
                </p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <StatusBadge status={claim.status} />
                <Link to={`/claims/${claim.id}`} className="text-xs font-semibold text-prime-700 hover:underline" onClick={(e) => e.stopPropagation()}>
                  Details
                </Link>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
};
