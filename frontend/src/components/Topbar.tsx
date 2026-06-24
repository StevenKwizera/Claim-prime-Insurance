import { Bell, LogOut, Menu, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useI18n } from "@/i18n/LanguageContext";
import { useNotifications } from "@/hooks/useClaims";
import { formatRoleLabel } from "@/utils/format";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import primeLogo from "@/logo prime.jpeg";

export const Topbar = ({ onOpenSidebar }: { onOpenSidebar?: () => void }) => {
  const { user, logout } = useAuth();
  const { t } = useI18n();
  const { data: notifications } = useNotifications();

  const unread = notifications?.filter((n) => n.status === "Unread").length ?? 0;

  const isAdmin = user?.role === "admin";

  return (
    <header className={`card overflow-hidden ${isAdmin ? "border-forest-300/50" : "border-forest-200/40"}`}>
      <div
        className={`h-1 ${
          isAdmin ? "bg-gradient-to-r from-gold-500 via-emerald-500 to-forest-800" : "bg-gradient-to-r from-forest-600 via-emerald-500 to-forest-700"
        }`}
      />
      <div className="flex flex-col gap-3 p-3 sm:p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 flex items-start gap-3">
          <button
            type="button"
            onClick={onOpenSidebar}
            className="btn-secondary px-2.5 py-2.5 lg:hidden"
            aria-label="Open navigation menu"
          >
            <Menu className="h-4 w-4" />
          </button>
          <Link to="/dashboard" className="hidden sm:block">
            <img src={primeLogo} alt="Prime Insurance" className="h-9 w-auto" />
          </Link>
          <div className="min-w-0">
            <p className="eyebrow text-slate-400">{isAdmin ? t("common.adminConsole") : t("common.welcomeBack")}</p>
            <h1 className="truncate text-base font-bold tracking-tight text-forest-900 sm:text-lg">{user?.name ?? "Guest"}</h1>
          </div>
          {isAdmin ? (
            <span className="hidden items-center gap-1 rounded-full border border-gold-200 bg-gold-50 px-2.5 py-1 text-xs font-bold text-gold-800 sm:inline-flex">
              <ShieldCheck className="h-3.5 w-3.5" />
              Admin
            </span>
          ) : null}
        </div>
        <div className="flex w-full flex-wrap items-center gap-2 sm:justify-end">
          <LanguageSwitcher />
          <div
            className={`hidden rounded-xl border px-3 py-2 text-xs font-semibold md:block ${
              isAdmin ? "border-gold-200 bg-gold-50/90 text-gold-900" : "border-forest-200 bg-forest-50/80 text-forest-900"
            }`}
          >
            {user ? `${formatRoleLabel(user.role)} · ${user.region ?? "HQ"}` : ""}
          </div>
          {isAdmin ? (
            <Link to="/admin/users" className="btn-gold hidden gap-2 sm:inline-flex">
              <ShieldCheck className="h-4 w-4" />
              User management
            </Link>
          ) : null}
          <Link
            to="/notifications"
            className="btn-secondary relative gap-2"
          >
            <Bell className="h-4 w-4 shrink-0 text-prime-600" />
            <span>{t("common.alerts")}</span>
            {unread > 0 ? (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-danger-500 px-1 text-[0.65rem] font-bold text-white">
                {unread > 99 ? "99+" : unread}
              </span>
            ) : (
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-500">
                {notifications?.length ?? 0}
              </span>
            )}
          </Link>
          <button type="button" onClick={logout} className="btn-secondary gap-2">
            <LogOut className="h-4 w-4" />
            {t("common.logout")}
          </button>
        </div>
        </div>
      </div>
    </header>
  );
};
