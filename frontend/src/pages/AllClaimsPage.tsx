import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ClaimTypeFilterTabs } from "@/components/claims/ClaimTypeFilterTabs";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { useAuth } from "@/hooks/useAuth";
import { useClaims } from "@/hooks/useClaims";
import { Claim } from "@/types";
import {
  CLAIM_TYPE_ORDER,
  ClaimTypeFilter,
  claimTypeLabel,
  filterClaimsByType,
  groupClaimsByType,
  sortClaimsNewestFirst
} from "@/utils/claimGrouping";
import { formatDate } from "@/utils/format";

export const AllClaimsPage = () => {
  const { data: claims = [], isLoading } = useClaims();
  const { user } = useAuth();
  const isStaff =
    user?.role === "officer" || user?.role === "supervisor" || user?.role === "admin" || user?.role === "fraud-investigator";

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<ClaimTypeFilter>("all");

  const applyFilters = (list: Claim[]) => {
    const q = query.trim().toLowerCase();
    return list.filter((claim) => {
      const matchesStatus = statusFilter === "all" || claim.status === statusFilter;
      const matchesQuery =
        !q ||
        claim.id.toLowerCase().includes(q) ||
        claim.claimantName.toLowerCase().includes(q) ||
        claim.policyNumber.toLowerCase().includes(q);
      return matchesStatus && matchesQuery;
    });
  };

  const sorted = useMemo(() => sortClaimsNewestFirst(claims), [claims]);
  const byType = useMemo(() => groupClaimsByType(sorted), [sorted]);

  const filtered = useMemo(
    () => applyFilters(filterClaimsByType(sorted, typeFilter)),
    [sorted, typeFilter, query, statusFilter]
  );

  const groupedSections = useMemo(() => {
    if (typeFilter !== "all") {
      return null;
    }
    return CLAIM_TYPE_ORDER.map((type) => ({
      type,
      claims: applyFilters(byType[type])
    })).filter((section) => section.claims.length > 0);
  }, [typeFilter, byType, query, statusFilter]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Claims registry"
        title={isStaff ? "All claims — classified by type" : "All claims in the system"}
        description={
          isStaff
            ? "Officers see every claim in the portfolio. Use Motor, Health, or Property tabs to focus on one line of business."
            : "Click any row to open the full claim workspace, review evidence, and approve or reject."
        }
        actions={<Link to="/verification" className="btn-primary">Verification workspace</Link>}
      />

      <ClaimTypeFilterTabs claims={sorted} value={typeFilter} onChange={setTypeFilter} />

      <div className="card flex flex-wrap gap-3 p-4">
        <input
          className="input min-w-[220px] flex-1"
          placeholder="Search by claim ID, claimant, or policy…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <select className="input w-auto" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="all">All statuses</option>
          <option value="Draft">Draft</option>
          <option value="Pending">Pending</option>
          <option value="Under Review">Under Review</option>
          <option value="Investigation">Investigation</option>
          <option value="Approved">Approved</option>
          <option value="Rejected">Rejected</option>
        </select>
      </div>

      {isLoading ? (
        <div className="card p-6 text-sm text-slate-500">Loading claims…</div>
      ) : typeFilter === "all" && groupedSections?.length ? (
        <div className="space-y-6">
          {groupedSections.map((section) => (
            <section key={section.type} className="card overflow-hidden">
              <div className="border-b border-slate-100 bg-slate-50 px-6 py-4">
                <h2 className="text-lg font-bold text-slate-900">{claimTypeLabel(section.type)}</h2>
                <p className="text-sm text-slate-500">{section.claims.length} claim(s) in this category</p>
              </div>
              <ClaimsTable claims={section.claims} />
            </section>
          ))}
        </div>
      ) : (
        <div className="card overflow-hidden">
          {filtered.length === 0 ? (
            <p className="p-6 text-sm text-slate-500">No claims match your filters.</p>
          ) : (
            <ClaimsTable claims={filtered} />
          )}
        </div>
      )}
    </div>
  );
};

const ClaimsTable = ({ claims }: { claims: Claim[] }) => (
  <div className="overflow-x-auto">
    <table className="min-w-full text-left text-sm">
      <thead className="bg-slate-50 text-slate-500">
        <tr>
          <th className="px-6 py-4">Claim</th>
          <th className="px-6 py-4">Type</th>
          <th className="px-6 py-4">Status</th>
          <th className="px-6 py-4">Risk</th>
          <th className="px-6 py-4">Files</th>
          <th className="px-6 py-4">Submitted</th>
          <th className="px-6 py-4">Officer</th>
          <th className="px-6 py-4"></th>
        </tr>
      </thead>
      <tbody>
        {claims.map((claim) => (
          <ClaimRow key={claim.id} claim={claim} />
        ))}
      </tbody>
    </table>
  </div>
);

const ClaimRow = ({ claim }: { claim: Claim }) => (
  <tr className="border-t border-slate-100 transition hover:bg-slate-50/80">
    <td className="px-6 py-4">
      <p className="font-semibold text-slate-900">{claim.id}</p>
      <p className="text-slate-500">{claim.claimantName}</p>
    </td>
    <td className="px-6 py-4 text-slate-700">{claimTypeLabel(claim.type)}</td>
    <td className="px-6 py-4">
      <StatusBadge status={claim.status} />
    </td>
    <td className="px-6 py-4 text-slate-700">{claim.riskScore}</td>
    <td className="px-6 py-4 text-slate-700">{claim.documents.length}</td>
    <td className="px-6 py-4 text-slate-700">{formatDate(claim.submittedAt)}</td>
    <td className="px-6 py-4 text-slate-700">{claim.assignedOfficer}</td>
    <td className="px-6 py-4">
      <Link to={`/claims/${claim.id}`} className="font-semibold text-prime-600 hover:underline">
        View & decide
      </Link>
    </td>
  </tr>
);
