interface AiExplanationPanelProps {
  claimId: string;
  recommendation: string;
  confidence: number;
  matchedRule: string;
  rationale: string[];
  overrideNote: string;
}

export const AiExplanationPanel = ({
  claimId,
  recommendation,
  confidence,
  matchedRule,
  rationale,
  overrideNote
}: AiExplanationPanelProps) => (
  <div className="card p-6">
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-prime-600">AI Explanation Panel</p>
        <h3 className="mt-2 text-xl font-bold text-slate-900">{claimId} recommendation trace</h3>
      </div>
      <div className="rounded-2xl bg-prime-50 px-4 py-3 text-right">
        <p className="text-xs uppercase tracking-[0.2em] text-prime-600">Confidence</p>
        <p className="text-2xl font-bold text-prime-700">{confidence}%</p>
      </div>
    </div>

    <div className="mt-5 grid gap-4 md:grid-cols-3">
      <div className="rounded-2xl bg-slate-50 p-4">
        <p className="text-sm text-slate-500">AI recommendation</p>
        <p className="mt-2 text-base font-semibold text-slate-900">{recommendation}</p>
      </div>
      <div className="rounded-2xl bg-slate-50 p-4">
        <p className="text-sm text-slate-500">Matched rule</p>
        <p className="mt-2 text-base font-semibold text-slate-900">{matchedRule}</p>
      </div>
      <div className="rounded-2xl bg-amber-50 p-4">
        <p className="text-sm text-amber-700">Human override note</p>
        <p className="mt-2 text-sm font-medium text-amber-900">{overrideNote}</p>
      </div>
    </div>

    <div className="mt-5">
      <p className="text-sm font-semibold text-slate-900">Decision rationale</p>
      <div className="mt-3 space-y-3">
        {rationale.map((item) => (
          <div key={item} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700">
            {item}
          </div>
        ))}
      </div>
    </div>
  </div>
);
