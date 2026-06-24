import { Activity, Clock3, ShieldAlert, ShieldCheck } from "lucide-react";

const cards = [
  { label: "Open claims", value: "192", delta: "+12%", icon: Activity },
  { label: "Approval rate", value: "77%", delta: "+4.8%", icon: ShieldCheck },
  { label: "Avg processing", value: "5.1d", delta: "-1.2d", icon: Clock3 },
  { label: "Fraud flags", value: "24", delta: "−3", icon: ShieldAlert }
];

export const OverviewCards = () => (
  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
    {cards.map(({ label, value, delta, icon: Icon }) => (
      <div key={label} className="card p-5">
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-500">{label}</p>
          <div className="rounded-2xl bg-prime-50 p-3 text-prime-700">
            <Icon className="h-5 w-5" />
          </div>
        </div>
        <p className="mt-4 text-3xl font-bold text-slate-900">{value}</p>
        <p className="mt-2 text-sm text-emerald-600">{delta} vs previous period</p>
      </div>
    ))}
  </div>
);
