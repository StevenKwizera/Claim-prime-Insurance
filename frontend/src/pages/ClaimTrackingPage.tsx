import { Link } from "react-router-dom";
import { Activity } from "lucide-react";
import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { ClaimManageActions } from "@/components/claims/ClaimManageActions";
import { useAuth } from "@/hooks/useAuth";
import { useClaims } from "@/hooks/useClaims";
import { useRealtimeClaims } from "@/hooks/useRealtimeClaims";
import { formatDate } from "@/utils/format";

const progressMap = {
  Draft: 10,
  Pending: 25,
  "Under Review": 55,
  Investigation: 72,
  Approved: 100,
  Rejected: 100
} as const;

export const ClaimTrackingPage = () => {
  const { data: claims = [], isLoading } = useClaims();
  const { user, token } = useAuth();
  const { connected, lastEvent } = useRealtimeClaims(token);

  const myClaims =
    user?.role === "claimant"
      ? claims.filter((c) => c.claimantName.trim().toLowerCase() === (user.name ?? "").trim().toLowerCase())
      : claims;

  const progressOf = (status: keyof typeof progressMap | string) =>
    status in progressMap ? progressMap[status as keyof typeof progressMap] : 20;

  const primary = myClaims[0];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Claim Tracking"
        title="Real-time lifecycle visibility"
        description="Live timeline, SLA hints, and streaming pipeline signals — aligned with your digital claims specification."
      />
      <div className="grid items-start gap-5 xl:grid-cols-[1.25fr_0.95fr]">
        <div className="card relative overflow-hidden p-4 sm:p-5 lg:sticky lg:top-4">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-400 via-prime-500 to-indigo-500" />
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 flex items-center gap-2.5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-prime-100 text-prime-700">
                <Activity className="h-4.5 w-4.5" />
              </div>
              <div className="min-w-0">
                <h3 className="truncate text-lg font-bold text-slate-900">Progress timeline</h3>
                <p className="text-xs text-slate-500">Latest activity stream for your most recent claim</p>
              </div>
            </div>
            <span
              className={`inline-flex max-w-full items-center rounded-full px-3 py-1.5 text-[11px] font-semibold ${
                connected ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-900"
              }`}
            >
              <span className="truncate">{lastEvent}</span>
            </span>
          </div>
          <div className="mt-5 space-y-4">
            {isLoading ? (
              <p className="text-sm text-slate-500">Loading timelines…</p>
            ) : primary ? (
              primary.timeline.map((entry, index) => (
                <div key={entry.id} className="relative flex gap-3 pl-1">
                  {index < primary.timeline.length - 1 ? (
                    <div className="absolute left-[7px] top-6 h-[calc(100%+0.5rem)] w-px bg-gradient-to-b from-prime-200 to-transparent" />
                  ) : null}
                  <div className="relative z-[1] mt-1.5 h-3 w-3 shrink-0 rounded-full bg-gradient-to-br from-prime-500 to-indigo-600 shadow-[0_0_0_4px_rgba(37,99,235,0.15)]" />
                  <div className="min-w-0 pb-1.5">
                    <p className="text-sm font-semibold text-slate-900">{entry.label}</p>
                    <p className="text-xs text-slate-500">
                      {entry.actor} · {formatDate(entry.at)}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <EmptyState
                title="No claims to display yet"
                description="Submit a claim from the dashboard to see status milestones and officer actions appear here."
              />
            )}
          </div>
        </div>
        <div className="space-y-4">
          {myClaims.length === 0 ? (
            <div className="card p-5">
              <EmptyState
                title="No claims available"
                description="Once claims are submitted, this panel will show progress cards with workflow status and assignments."
              />
            </div>
          ) : (
            myClaims.map((claim) => (
            <div key={claim.id} className="card group overflow-hidden p-4 transition hover:shadow-[0_16px_40px_rgba(15,23,42,0.08)]">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{claim.id}</p>
                  <h3 className="mt-0.5 truncate text-base font-bold text-slate-900">{claim.claimantName}</h3>
                </div>
                <StatusBadge status={claim.status} />
              </div>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">{claim.aiSummary}</p>
              <div className="mt-3">
                <div className="mb-1.5 flex items-center justify-between text-[11px] font-semibold text-slate-500">
                  <span>Workflow progress</span>
                  <span>{progressOf(claim.status)}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-slate-100">
                  <div
                    className="h-1.5 rounded-full bg-gradient-to-r from-prime-600 to-indigo-500 transition-all duration-500"
                    style={{ width: `${progressOf(claim.status)}%` }}
                  />
                </div>
              </div>
              <div className="mt-3 grid gap-2 rounded-xl bg-slate-50 px-3 py-2.5 text-xs text-slate-600">
                <div>Assigned team: <span className="font-semibold text-slate-900">{claim.assignedTeam}</span></div>
                <div>Assigned officer: <span className="font-semibold text-slate-900">{claim.assignedOfficer}</span></div>
              </div>
              <p className="mt-3 text-xs font-medium text-slate-700">Estimated completion: {formatDate(claim.estimatedCompletion)}</p>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <Link to={`/claims/${claim.id}`} className="inline-flex text-xs font-semibold text-prime-600 hover:text-prime-700">
                  Open claim workspace
                </Link>
                {user?.role === "claimant" ? <ClaimManageActions claim={claim} /> : null}
              </div>
            </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
