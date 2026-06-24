interface TamperingAlert {
  title: string;
  severity: "Low" | "Medium" | "High";
  detail: string;
}

export const TamperingAlertsPanel = ({
  claimId,
  alerts
}: {
  claimId: string;
  alerts: TamperingAlert[];
}) => (
  <div className="card p-6">
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-rose-600">Document Tampering Detection</p>
        <h3 className="mt-2 text-xl font-bold text-slate-900">{claimId} integrity signals</h3>
      </div>
      <span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-700">
        {alerts.length} alerts detected
      </span>
    </div>

    <div className="mt-5 space-y-3">
      {alerts.map((alert) => (
        <div key={alert.title} className="rounded-2xl border border-slate-200 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-semibold text-slate-900">{alert.title}</p>
              <p className="mt-1 text-sm text-slate-500">{alert.detail}</p>
            </div>
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                alert.severity === "High"
                  ? "bg-rose-100 text-rose-700"
                  : alert.severity === "Medium"
                    ? "bg-amber-100 text-amber-700"
                    : "bg-blue-100 text-blue-700"
              }`}
            >
              {alert.severity}
            </span>
          </div>
        </div>
      ))}
    </div>
  </div>
);
