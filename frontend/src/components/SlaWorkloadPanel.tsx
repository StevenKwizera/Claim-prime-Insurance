import { Clock3, ListTodo, ShieldAlert, Users } from "lucide-react";
import { Claim } from "@/types";
import { formatDate } from "@/utils/format";

const diffDays = (date: string) =>
  Math.ceil((new Date(date).getTime() - new Date("2026-04-27T00:00:00Z").getTime()) / (1000 * 60 * 60 * 24));

export const SlaWorkloadPanel = ({ claims }: { claims: Claim[] }) => {
  const overdueClaims = claims.filter((claim) => diffDays(claim.estimatedCompletion) < 0);
  const nearDeadline = claims.filter((claim) => {
    const days = diffDays(claim.estimatedCompletion);
    return days >= 0 && days <= 3;
  });
  const investigationLoad = claims.filter((claim) => claim.status === "Investigation").length;
  const averagePerOfficer = (claims.length / 4).toFixed(1);

  const cards = [
    { label: "Overdue claims", value: String(overdueClaims.length), detail: "Need supervisor attention", icon: Clock3, tone: "rose" },
    { label: "Near SLA breach", value: String(nearDeadline.length), detail: "Due within 72 hours", icon: ShieldAlert, tone: "amber" },
    { label: "Officer workload", value: averagePerOfficer, detail: "Average active claims per officer", icon: Users, tone: "blue" },
    { label: "Investigation queue", value: String(investigationLoad), detail: "Claims under enhanced review", icon: ListTodo, tone: "slate" }
  ] as const;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <div key={card.label} className="card p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500">{card.label}</p>
              <div className="rounded-2xl bg-slate-100 p-3 text-slate-700">
                <card.icon className="h-5 w-5" />
              </div>
            </div>
            <p className="mt-4 text-3xl font-bold text-slate-900">{card.value}</p>
            <p className="mt-2 text-sm text-slate-500">{card.detail}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
        <div className="card p-6">
          <h3 className="text-xl font-bold text-slate-900">SLA priority list</h3>
          <div className="mt-4 space-y-3">
            {nearDeadline.map((claim) => (
              <div key={claim.id} className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 p-4">
                <div>
                  <p className="font-semibold text-slate-900">{claim.id}</p>
                  <p className="text-sm text-slate-500">{claim.claimantName} · Due {formatDate(claim.estimatedCompletion)}</p>
                </div>
                <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">Priority</span>
              </div>
            ))}
            {nearDeadline.length === 0 ? (
              <div className="rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-800">No claims are approaching breach thresholds right now.</div>
            ) : null}
          </div>
        </div>

        <div className="card p-6">
          <h3 className="text-xl font-bold text-slate-900">Team workload snapshot</h3>
          <div className="mt-4 space-y-3">
            {[
              ["Grace Uwase", "6 active claims", "2 need decision today"],
              ["Daniel Mugisha", "4 active claims", "1 flagged by AI"],
              ["Claire Uwimana", "5 active claims", "No SLA risks"],
              ["Fraud desk", "3 investigations", "1 high-priority pattern"]
            ].map(([name, load, note]) => (
              <div key={name} className="rounded-2xl bg-slate-50 p-4">
                <p className="font-semibold text-slate-900">{name}</p>
                <p className="mt-1 text-sm text-slate-600">{load}</p>
                <p className="mt-1 text-xs text-slate-500">{note}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
