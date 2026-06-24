import { Link } from "react-router-dom";
import {
  Activity,
  ArrowRight,
  BadgeCheck,
  Car,
  CheckCircle2,
  ClipboardList,
  Clock3,
  Files,
  HeartPulse,
  Home,
  MailCheck,
  ScrollText,
  ShieldAlert,
  Sparkles
} from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";
import { MetricCard, MetricCardGrid } from "@/components/MetricCard";
import { Claim, ClaimType, User } from "@/types";
import {
  CLAIM_TYPE_ORDER,
  claimTypeLabel,
  claimTypeShortLabel,
  countClaimsByType,
  groupClaimsByType,
  sortClaimsNewestFirst
} from "@/utils/claimGrouping";
import { formatDate } from "@/utils/format";

type Props = {
  user: User;
  claims: Claim[];
};

const typeIcons: Record<ClaimType, typeof Car> = {
  auto: Car,
  health: HeartPulse,
  property: Home
};

const typeAccent: Record<ClaimType, string> = {
  auto: "from-blue-500/10 to-blue-600/5 text-blue-700 ring-blue-100",
  health: "from-emerald-500/10 to-emerald-600/5 text-emerald-700 ring-emerald-100",
  property: "from-amber-500/10 to-amber-600/5 text-amber-800 ring-amber-100"
};

function QuickAction({
  to,
  label,
  icon: Icon,
  tone = "slate"
}: {
  to: string;
  label: string;
  icon: typeof ClipboardList;
  tone?: "slate" | "prime" | "emerald";
}) {
  const tones = {
    slate: "hover:border-slate-300 hover:bg-slate-50 text-slate-700",
    prime: "hover:border-prime-300 hover:bg-prime-50/80 text-prime-800",
    emerald: "hover:border-emerald-300 hover:bg-emerald-50/80 text-emerald-800"
  };
  return (
    <Link
      to={to}
      className={`flex flex-col items-center gap-2 rounded-xl border border-slate-200/90 bg-white px-2 py-3 text-center shadow-sm transition ${tones[tone]}`}
    >
      <Icon className="h-4 w-4 shrink-0 opacity-80" />
      <span className="text-[11px] font-semibold leading-tight">{label}</span>
    </Link>
  );
}

function ClaimMiniRow({ claim }: { claim: Claim }) {
  return (
    <Link
      to={`/claims/${claim.id}`}
      className="group flex items-center gap-3 rounded-lg border border-transparent px-2 py-2 transition hover:border-slate-200 hover:bg-slate-50"
    >
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold text-slate-900">{claim.id}</span>
          <StatusBadge status={claim.status} />
        </div>
        <p className="mt-0.5 truncate text-xs text-slate-500">
          {claim.claimantName} · {claimTypeShortLabel(claim.type)} · Risk {claim.riskScore}
        </p>
      </div>
      <div className="shrink-0 text-right">
        <p className="text-xs font-bold tabular-nums text-slate-700">{claim.riskScore}</p>
        <p className="text-[10px] text-slate-400">risk</p>
      </div>
      <ArrowRight className="h-3.5 w-3.5 shrink-0 text-slate-300 transition group-hover:text-prime-600" />
    </Link>
  );
}

export const OfficerDashboard = ({ user, claims }: Props) => {
  const typeCounts = countClaimsByType(claims);
  const byType = groupClaimsByType(claims);
  const sorted = sortClaimsNewestFirst(claims);

  const pending = sorted.filter((c) => c.status === "Pending" || c.status === "Under Review");
  const investigation = sorted.filter((c) => c.status === "Investigation");
  const approved = sorted.filter((c) => c.status === "Approved");
  const flaggedDocs = claims.reduce((n, c) => n + c.documents.filter((d) => d.aiStatus === "Flagged").length, 0);
  const highRisk = sorted.filter((c) => c.riskScore >= 60);
  const today = new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
  });

  return (
    <div className="space-y-5">
      {/* Welcome strip */}
      <div className="relative overflow-hidden rounded-2xl border border-forest-600/30 bg-gradient-to-br from-forest-800 via-forest-900 to-forest-950 px-5 py-4 text-white shadow-[0_16px_48px_rgba(10,31,23,0.28)] sm:px-6 sm:py-5">
        <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-emerald-400/12 blur-2xl" />
        <div className="absolute bottom-0 left-1/3 h-24 w-24 rounded-full bg-teal-400/10 blur-xl" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="flex items-center gap-1.5 text-xs font-medium text-emerald-200/90">
              <Sparkles className="h-3.5 w-3.5" />
              Claims Officer Workspace
            </p>
            <h2 className="mt-1 text-xl font-bold tracking-tight sm:text-2xl">Good day, {user.name.split(" ")[0]}</h2>
            <p className="mt-1 text-sm text-emerald-100/70">{today} · {user.region ?? "HQ"} · {typeCounts.all} claims in portfolio</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link to="/verification" className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-2 text-xs font-semibold backdrop-blur transition hover:bg-white/20">
              <BadgeCheck className="h-3.5 w-3.5" />
              Verification
            </Link>
            <Link to="/verification/all-claims" className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-400">
              <ClipboardList className="h-3.5 w-3.5" />
              All claims
            </Link>
          </div>
        </div>
      </div>

      <div className="dashboard-stat-band">
        <MetricCardGrid columns={6}>
          <MetricCard title="Portfolio" value={String(typeCounts.all)} detail="All claim types" icon={ClipboardList} variant="forest" trend={{ label: "Total", direction: "neutral" }} />
          <MetricCard title="Queue" value={String(pending.length)} detail="Needs review" icon={Clock3} variant="amber" trend={{ label: "In review", direction: pending.length ? "up" : "down" }} />
          <MetricCard title="Motor" value={String(typeCounts.auto)} detail="Auto claims" icon={Car} variant="blue" trend={{ label: "Auto line", direction: "neutral" }} />
          <MetricCard title="Health" value={String(typeCounts.health)} detail="Medical claims" icon={HeartPulse} variant="emerald" trend={{ label: "Health line", direction: "neutral" }} />
          <MetricCard title="Property" value={String(typeCounts.property)} detail="Home & flood" icon={Home} variant="gold" trend={{ label: "Property line", direction: "neutral" }} />
          <MetricCard title="Flagged" value={String(flaggedDocs)} detail="Documents to check" icon={ShieldAlert} variant="rose" trend={{ label: "AI flags", direction: flaggedDocs ? "up" : "down" }} />
        </MetricCardGrid>
      </div>

      <div className="grid gap-4 lg:grid-cols-12">
        {/* Main column */}
        <div className="space-y-4 lg:col-span-8">
          {/* Priority queue */}
          <section className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Priority review queue</h3>
                <p className="text-xs text-slate-500">Pending and under review — newest first</p>
              </div>
              <Link to="/evaluation/decision" className="text-xs font-semibold text-prime-600 hover:underline">
                Approve / reject →
              </Link>
            </div>
            <div className="mt-2 divide-y divide-slate-100">
              {pending.length === 0 ? (
                <p className="py-6 text-center text-sm text-slate-500">No claims awaiting review.</p>
              ) : (
                pending.slice(0, 6).map((claim) => <ClaimMiniRow key={claim.id} claim={claim} />)
              )}
            </div>
            {pending.length > 6 ? (
              <p className="mt-2 text-center text-xs text-slate-500">+{pending.length - 6} more in queue</p>
            ) : null}
          </section>

          {/* By type — compact columns */}
          <section className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Claims by line of business</h3>
                <p className="text-xs text-slate-500">Motor · Health · Property</p>
              </div>
              <Link to="/verification/all-claims" className="text-xs font-semibold text-prime-600 hover:underline">
                Full registry →
              </Link>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              {CLAIM_TYPE_ORDER.map((type) => {
                const Icon = typeIcons[type];
                const list = byType[type].slice(0, 3);
                return (
                  <div
                    key={type}
                    className={`rounded-xl bg-gradient-to-br p-3 ring-1 ${typeAccent[type]}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4 shrink-0" />
                        <span className="text-xs font-bold">{claimTypeShortLabel(type)}</span>
                      </div>
                      <span className="rounded-md bg-white/70 px-1.5 py-0.5 text-[10px] font-bold tabular-nums">
                        {byType[type].length}
                      </span>
                    </div>
                    <ul className="mt-2 space-y-1">
                      {list.length === 0 ? (
                        <li className="text-[11px] opacity-70">No claims</li>
                      ) : (
                        list.map((c) => (
                          <li key={c.id}>
                            <Link
                              to={`/claims/${c.id}`}
                              className="block truncate rounded-md px-1 py-0.5 text-[11px] font-medium transition hover:bg-white/60"
                            >
                              {c.id} · {c.status}
                            </Link>
                          </li>
                        ))
                      )}
                    </ul>
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        {/* Sidebar */}
        <aside className="space-y-4 lg:col-span-4">
          {/* Quick actions */}
          <section className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900">Quick actions</h3>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <QuickAction to="/verification" label="Verify docs" icon={BadgeCheck} tone="prime" />
              <QuickAction to="/evaluation/decision" label="Decisions" icon={CheckCircle2} tone="emerald" />
              <QuickAction to="/verification/missing-request" label="Request info" icon={MailCheck} />
              <QuickAction to="/evidence/gallery" label="Evidence" icon={Files} />
              <QuickAction to="/reports" label="Reports" icon={ScrollText} />
              <QuickAction to="/evaluation/internal-notes" label="Case notes" icon={Activity} />
            </div>
          </section>

          {/* Workload snapshot */}
          <section className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900">Workload snapshot</h3>
            <dl className="mt-3 space-y-2.5">
              <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                <dt className="text-xs text-slate-600">Under investigation</dt>
                <dd className="text-sm font-bold tabular-nums text-violet-700">{investigation.length}</dd>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                <dt className="text-xs text-slate-600">Approved (portfolio)</dt>
                <dd className="text-sm font-bold tabular-nums text-emerald-700">{approved.length}</dd>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                <dt className="text-xs text-slate-600">High risk (≥60)</dt>
                <dd className="text-sm font-bold tabular-nums text-rose-700">{highRisk.length}</dd>
              </div>
            </dl>
          </section>

          {/* High risk alerts */}
          <section className="rounded-2xl border border-rose-100 bg-gradient-to-br from-rose-50/80 to-white p-4 shadow-sm">
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-rose-600" />
              <h3 className="text-sm font-bold text-slate-900">Elevated risk</h3>
            </div>
            {highRisk.length === 0 ? (
              <p className="mt-3 text-xs text-slate-500">No high-risk claims right now.</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {highRisk.slice(0, 4).map((c) => (
                  <li key={c.id}>
                    <Link
                      to={`/claims/${c.id}`}
                      className="flex items-center justify-between rounded-lg border border-rose-100 bg-white px-2.5 py-2 text-xs transition hover:border-rose-200"
                    >
                      <span className="font-semibold text-slate-800">{c.id}</span>
                      <span className="font-bold tabular-nums text-rose-600">{c.riskScore}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            <Link to="/fraud" className="mt-3 inline-block text-xs font-semibold text-rose-700 hover:underline">
              Fraud overview →
            </Link>
          </section>
        </aside>
      </div>

      {/* Recent activity strip */}
      <section className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">Recent submissions</h3>
          <span className="text-[10px] font-medium uppercase tracking-wide text-slate-400">Latest 5</span>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-xs">
            <thead className="text-[10px] uppercase tracking-wide text-slate-400">
              <tr>
                <th className="pb-2 pr-4 font-semibold">Claim</th>
                <th className="pb-2 pr-4 font-semibold">Type</th>
                <th className="pb-2 pr-4 font-semibold">Status</th>
                <th className="pb-2 pr-4 font-semibold">Risk</th>
                <th className="pb-2 pr-4 font-semibold">Submitted</th>
                <th className="pb-2 font-semibold"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sorted.slice(0, 5).map((claim) => (
                <tr key={claim.id} className="text-slate-700">
                  <td className="py-2 pr-4">
                    <p className="font-semibold text-slate-900">{claim.id}</p>
                    <p className="text-[11px] text-slate-500">{claim.claimantName}</p>
                  </td>
                  <td className="py-2 pr-4 capitalize">{claimTypeLabel(claim.type)}</td>
                  <td className="py-2 pr-4">
                    <StatusBadge status={claim.status} />
                  </td>
                  <td className="py-2 pr-4 font-semibold tabular-nums">{claim.riskScore}</td>
                  <td className="py-2 pr-4 text-slate-500">{formatDate(claim.submittedAt)}</td>
                  <td className="py-2">
                    <Link to={`/claims/${claim.id}`} className="font-semibold text-prime-600 hover:underline">
                      Open
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
