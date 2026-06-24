import { PageHeader } from "@/components/PageHeader";
import { useClaims } from "@/hooks/useClaims";

export const FraudPage = () => {
  const { data: claims = [] } = useClaims();
  const highRisk = claims.filter((claim) => claim.riskScore >= 50);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Fraud Detection"
        title="Monitor risk and suspicious claim networks"
        description="Combine AI risk scoring, flagged cases, and relationship visualization placeholders for deeper investigation workflows."
      />
      <div className="grid gap-6 lg:grid-cols-[0.7fr_1.3fr]">
        <div className="card p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gold-500">High Risk Pool</p>
          <p className="mt-4 text-5xl font-bold text-slate-900">{highRisk.length}</p>
          <p className="mt-2 text-sm text-slate-500">Claims currently over the fraud escalation threshold.</p>
        </div>
        <div className="card p-6">
          <h3 className="text-xl font-bold text-slate-900">Network / heatmap placeholder</h3>
          <div className="mt-4 grid h-72 place-items-center rounded-3xl bg-[linear-gradient(135deg,#dcfce7,#dbeafe,#fee2e2)] text-center">
            <div>
              <p className="text-lg font-semibold text-slate-900">Visual fraud graph area</p>
              <p className="mt-2 max-w-md text-sm text-slate-600">Use this panel for claimant-vendor-device links, repeat incidents, or heatmap clustering.</p>
            </div>
          </div>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {highRisk.map((claim) => (
          <div key={claim.id} className="card p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold text-slate-900">{claim.id}</p>
                <p className="text-sm text-slate-500">{claim.claimantName} · {claim.region}</p>
              </div>
              <div className="rounded-full bg-gold-400/25 px-3 py-1 text-xs font-semibold text-gold-500">
                Risk {claim.riskScore}
              </div>
            </div>
            <p className="mt-4 text-sm text-slate-600">{claim.aiSummary}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
