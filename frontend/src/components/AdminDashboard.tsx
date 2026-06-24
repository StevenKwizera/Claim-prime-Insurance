import { Link } from "react-router-dom";
import {
  Activity,
  BarChart3,
  Lock,
  MailCheck,
  ScrollText,
  Shield,
  UserCog,
  Users
} from "lucide-react";
import { MetricCard, MetricCardGrid } from "@/components/MetricCard";
import { SectionCard } from "@/components/SectionCard";
import { useNotifications } from "@/hooks/useClaims";
import { Claim, User } from "@/types";
import { formatRoleLabel } from "@/utils/format";

const adminModules = [
  { label: "Manage users", to: "/admin/users", icon: Users, tone: "from-forest-500/15 to-emerald-600/5 border-forest-200/60" },
  { label: "System rules & security", to: "/admin/security", icon: Lock, tone: "from-rose-500/12 to-rose-600/5 border-rose-200/60" },
  { label: "Login activity logs", to: "/admin/login-activity", icon: Activity, tone: "from-slate-500/10 to-transparent border-slate-200/70" },
  { label: "Reports", to: "/reports", icon: ScrollText, tone: "from-blue-500/12 to-transparent border-blue-200/60" },
  { label: "Analytics overview", to: "/analytics/executive", icon: BarChart3, tone: "from-gold-500/18 to-gold-600/5 border-amber-200/60" },
  { label: "Audit trail", to: "/reports/audit-trail", icon: Shield, tone: "from-forest-700/10 to-forest-900/5 border-forest-200/60" }
];

export const AdminDashboard = ({ users, claims }: { users: User[]; claims: Claim[] }) => {
  const { data: notifications = [] } = useNotifications();
  const staff = users.filter((u) => u.role !== "claimant");
  const pending = users.filter((u) => u.status === "Pending");
  const highRisk = claims.filter((c) => c.riskScore >= 25).length;
  const unread = notifications.filter((n) => n.status === "Unread" || n.status === "Action Needed").length;

  return (
    <div className="space-y-6">
      <section className="admin-hero relative overflow-hidden rounded-3xl border border-forest-500/30 p-6 sm:p-8">
        <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-300/90">Prime Insurance · Admin</p>
            <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-white sm:text-3xl">Administrator console</h2>
            <p className="mt-3 text-sm leading-relaxed text-emerald-100/75">
              Manage users, configure security rules, monitor login logs, and view reports — verification system only, no payments.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link to="/admin/users" className="btn-gold">
              Manage users
            </Link>
            <Link to="/admin/security" className="btn-secondary border-white/20 bg-white/10 text-white hover:bg-white/20">
              Security
            </Link>
          </div>
        </div>
      </section>

      <div className="dashboard-stat-band">
        <MetricCardGrid columns={4}>
          <MetricCard
            title="Total users"
            value={String(users.length)}
            detail={`${staff.length} staff accounts`}
            icon={Users}
            variant="forest"
            trend={{ label: `${staff.length} staff`, direction: "up" }}
          />
          <MetricCard
            title="Pending setup"
            value={String(pending.length)}
            detail="Awaiting first login or activation"
            icon={UserCog}
            variant="amber"
            trend={{ label: pending.length ? "Needs action" : "All clear", direction: pending.length ? "up" : "neutral" }}
          />
          <MetricCard
            title="Active claims"
            value={String(claims.length)}
            detail={`${highRisk} high-risk flagged`}
            icon={Activity}
            variant="teal"
            trend={{ label: `${highRisk} flagged`, direction: highRisk > 0 ? "up" : "down" }}
          />
          <MetricCard
            title="Notifications"
            value={String(unread)}
            detail="Unread or action needed"
            icon={MailCheck}
            variant="gold"
            trend={{ label: unread ? "New alerts" : "Inbox clear", direction: unread ? "up" : "neutral" }}
          />
        </MetricCardGrid>
      </div>

      <SectionCard title="Platform modules" description="Jump directly into administration and oversight tools.">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {adminModules.map((mod) => (
            <Link
              key={mod.to}
              to={mod.to}
              className={`group flex items-center gap-4 rounded-2xl border bg-gradient-to-br ${mod.tone} p-4 transition hover:border-forest-400 hover:shadow-md`}
            >
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-white shadow-sm ring-1 ring-forest-100/80">
                <mod.icon className="h-5 w-5 text-forest-700" />
              </span>
              <span className="font-semibold text-forest-900 group-hover:text-forest-800">{mod.label}</span>
            </Link>
          ))}
        </div>
      </SectionCard>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <SectionCard
          title="Staff directory"
          description="Recently registered or updated accounts."
          action={
            <Link to="/admin/users" className="btn-primary">
              Open user management
            </Link>
          }
        >
          <div className="space-y-2">
            {staff.length ? (
              staff.slice(0, 8).map((item) => (
                <div
                  key={item.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-slate-100 bg-slate-50/80 px-4 py-3"
                >
                  <div>
                    <p className="font-semibold text-navy-900">{item.name}</p>
                    <p className="text-xs text-slate-500">{item.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-prime-50 px-2.5 py-1 text-xs font-semibold text-prime-800">
                      {formatRoleLabel(item.role)}
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                        item.status === "Pending" ? "bg-amber-100 text-amber-800" : "bg-emerald-50 text-emerald-800"
                      }`}
                    >
                      {item.status ?? "Active"}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500">No staff users in the database yet.</p>
            )}
          </div>
        </SectionCard>

        <SectionCard title="Operations snapshot" description="Live claim portfolio summary.">
          <dl className="space-y-4">
            <div className="flex justify-between border-b border-slate-100 pb-3">
              <dt className="text-sm text-slate-500">Under review</dt>
              <dd className="font-bold text-navy-900">{claims.filter((c) => c.status === "Under Review").length}</dd>
            </div>
            <div className="flex justify-between border-b border-slate-100 pb-3">
              <dt className="text-sm text-slate-500">Investigation</dt>
              <dd className="font-bold text-navy-900">{claims.filter((c) => c.status === "Investigation").length}</dd>
            </div>
            <div className="flex justify-between border-b border-slate-100 pb-3">
              <dt className="text-sm text-slate-500">Approved</dt>
              <dd className="font-bold text-navy-900">{claims.filter((c) => c.status === "Approved").length}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-slate-500">Rejected</dt>
              <dd className="font-bold text-navy-900">{claims.filter((c) => c.status === "Rejected").length}</dd>
            </div>
          </dl>
          <Link to="/analytics/executive" className="btn-secondary mt-5 w-full justify-center">
            View executive dashboard
          </Link>
        </SectionCard>
      </div>
    </div>
  );
};
