import { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { RefreshCw } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { useAnalytics } from "@/hooks/useClaims";

export const AnalyticsPage = () => {
  const { data = [], isFetching, refetch } = useAnalytics();
  const [lastRefresh, setLastRefresh] = useState(() => new Date());

  const handleRefresh = async () => {
    await refetch();
    setLastRefresh(new Date());
  };

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Analytics Dashboard"
        title="Claims performance and operational trends"
        description="Volume, throughput, and approval curves backed by your API — use refresh to pull the latest aggregates."
        actions={
          <button
            type="button"
            className="btn-secondary inline-flex items-center gap-2"
            onClick={() => void handleRefresh()}
            disabled={isFetching}
          >
            <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
            {isFetching ? "Refreshing…" : "Refresh data"}
          </button>
        }
      />
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-slate-100 bg-white/80 px-4 py-3 text-sm text-slate-600 shadow-sm backdrop-blur">
        <span>
          Last updated:{" "}
          <span className="font-semibold text-slate-900">
            {lastRefresh.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
          </span>
        </span>
        <span className="text-xs text-slate-400">Filters below are UI-ready for API wiring.</span>
      </div>
      <div className="flex flex-wrap gap-3">
        <select className="input max-w-xs">
          <option>Last 30 days</option>
          <option>Last quarter</option>
          <option>Year to date</option>
        </select>
        <select className="input max-w-xs">
          <option>All regions</option>
          <option>Kigali</option>
          <option>Eastern</option>
        </select>
        <select className="input max-w-xs">
          <option>All claim types</option>
          <option>Auto</option>
          <option>Health</option>
          <option>Property</option>
        </select>
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <div className="card overflow-hidden p-6">
          <div className="flex items-center justify-between gap-4">
            <h3 className="text-xl font-bold text-slate-900">Claims over time</h3>
            <span className="rounded-full bg-prime-50 px-3 py-1 text-xs font-semibold text-prime-700">Live dataset</span>
          </div>
          <div className="mt-6 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="label" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="claims" stroke="#1d4ed8" strokeWidth={3} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="approved" stroke="#dfac37" strokeWidth={3} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="card overflow-hidden p-6">
          <div className="flex items-center justify-between gap-4">
            <h3 className="text-xl font-bold text-slate-900">Processing time</h3>
            <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">Avg. days</span>
          </div>
          <div className="mt-6 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="label" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="avgDays" fill="#2563eb" radius={[12, 12, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
