import { ChevronDown, LogOut, Sparkles, X } from "lucide-react";
import { useMemo, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { getSidebarSectionsForRole, SidebarNavSection } from "@/config/sidebarNavigation";
import { formatRoleLabel } from "@/utils/format";
import { UserRole } from "@/types";
import primeLogo from "@/logo prime.jpeg";

const roleAccent: Record<UserRole, string> = {
  claimant: "from-teal-400 to-emerald-500",
  agent: "from-sky-400 to-blue-500",
  officer: "from-emerald-400 to-teal-500",
  supervisor: "from-amber-400 to-gold-500",
  "fraud-investigator": "from-rose-400 to-orange-500",
  admin: "from-gold-400 to-amber-500"
};

function initials(name?: string) {
  if (!name) {
    return "?";
  }
  return name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function SidebarNav({
  sections,
  onNavigate
}: {
  sections: SidebarNavSection[];
  onNavigate?: () => void;
}) {
  const location = useLocation();
  const [openSections, setOpenSections] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(sections.map((section) => [section.id, true]))
  );

  const toggleSection = (id: string) => {
    setOpenSections((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <nav className="sidebar-scroll flex-1 overflow-y-auto px-1 py-2">
      {sections.map((section) => {
        const isOpen = openSections[section.id] !== false;
        return (
          <div key={section.id} className="mb-4">
            <button
              type="button"
              onClick={() => toggleSection(section.id)}
              className="sidebar-section-toggle"
            >
              <span>{section.title}</span>
              <ChevronDown className={`h-3.5 w-3.5 transition ${isOpen ? "" : "-rotate-90"}`} />
            </button>
            {isOpen ? (
              <div className="mt-1 space-y-1">
                {section.items.map(({ to, label, icon: Icon, highlight }) => {
                  const active = location.pathname === to || (to !== "/dashboard" && location.pathname.startsWith(`${to}/`));
                  return (
                    <NavLink
                      key={to}
                      to={to}
                      onClick={onNavigate}
                      className={`sidebar-nav-link ${active ? "sidebar-nav-link-active" : ""} ${
                        highlight && !active ? "sidebar-nav-link-highlight" : ""
                      }`}
                    >
                      <span className={`sidebar-nav-icon ${active ? "sidebar-nav-icon-active" : ""}`}>
                        <Icon className="h-4 w-4" aria-hidden />
                      </span>
                      <span className="truncate">{label}</span>
                      {active ? <span className="sidebar-nav-dot" aria-hidden /> : null}
                    </NavLink>
                  );
                })}
              </div>
            ) : null}
          </div>
        );
      })}
    </nav>
  );
}

export const Sidebar = ({
  variant = "desktop",
  onClose
}: {
  variant?: "desktop" | "mobile";
  onClose?: () => void;
}) => {
  const { user, logout } = useAuth();
  const role = user?.role ?? "claimant";
  const sections = getSidebarSectionsForRole(role);
  const accent = roleAccent[role];
  const widthClass = role === "admin" ? "lg:w-[19.5rem]" : "lg:w-[18rem]";

  const shellClass =
    variant === "mobile"
      ? "sidebar-shell flex h-full w-[min(20rem,90vw)] flex-col"
      : `sidebar-shell sticky top-3 hidden h-[calc(100vh-1.5rem)] w-[min(20rem,90vw)] ${widthClass} shrink-0 flex-col lg:flex`;

  const roleLabel = useMemo(() => formatRoleLabel(role), [role]);

  return (
    <aside className={shellClass}>
      {variant === "mobile" ? (
        <div className="mb-2 flex items-center justify-between border-b border-white/10 px-4 py-3">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-white/80">Menu</p>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-white/20 bg-white/10 p-2 text-white hover:bg-white/15"
            aria-label="Close navigation menu"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : null}

      <div className="sidebar-brand px-4 pt-4">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-white p-1.5 shadow-lg ring-1 ring-white/40">
            <img src={primeLogo} alt="Prime Insurance" className="h-9 w-auto" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-white">Prime Claims Portal</p>
            <p className="truncate text-[0.68rem] font-medium uppercase tracking-[0.12em] text-emerald-200/90">
              Digital insurance
            </p>
          </div>
        </div>

        <div className={`mt-4 inline-flex items-center gap-2 rounded-full bg-gradient-to-r ${accent} px-3 py-1.5 shadow-md`}>
          <Sparkles className="h-3.5 w-3.5 text-white" />
          <span className="text-[0.68rem] font-bold uppercase tracking-[0.08em] text-white">{roleLabel}</span>
        </div>
      </div>

      <SidebarNav sections={sections} onNavigate={variant === "mobile" ? onClose : undefined} />

      <div className="sidebar-footer mx-3 mb-3 mt-2 space-y-2">
        <div className="sidebar-user-card">
          <div className="sidebar-user-avatar">{initials(user?.name)}</div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-white">{user?.name ?? "Guest"}</p>
            <p className="truncate text-xs text-white/70">{user?.email ?? "—"}</p>
          </div>
        </div>
        <button type="button" onClick={logout} className="sidebar-logout-btn">
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
    </aside>
  );
};
