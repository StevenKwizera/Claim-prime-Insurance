import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import { HelpChatFab } from "@/components/HelpChatFab";
import { Sidebar } from "@/components/Sidebar";
import { Topbar } from "@/components/Topbar";
import { useAuth } from "@/hooks/useAuth";

export const AppLayout = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  useEffect(() => {
    if (!isMobileSidebarOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsMobileSidebarOpen(false);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isMobileSidebarOpen]);

  return (
    <>
      {isMobileSidebarOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true">
          <button
            type="button"
            className="absolute inset-0 bg-slate-950/40"
            aria-label="Close navigation menu"
            onClick={() => setIsMobileSidebarOpen(false)}
          />
          <div className="absolute inset-y-2 left-2">
            <Sidebar variant="mobile" onClose={() => setIsMobileSidebarOpen(false)} />
          </div>
        </div>
      ) : null}

      <div
        className={`flex w-full px-2 py-2 sm:px-3 lg:px-4 ${isAdmin ? "gap-3 sm:gap-4 lg:gap-5" : "gap-2 sm:gap-3 lg:gap-4"}`}
        data-role={isAdmin ? "admin" : undefined}
      >
        <Sidebar />
        <main className={`dashboard-compact min-w-0 flex-1 space-y-5 overflow-x-hidden pb-6 ${isAdmin ? "lg:max-w-[calc(100%-21rem)]" : ""}`}>
          <Topbar onOpenSidebar={() => setIsMobileSidebarOpen(true)} />
          <div className="mx-auto w-full max-w-[1680px] px-1 sm:px-0">
            <Outlet />
          </div>
        </main>
      </div>
      <HelpChatFab />
    </>
  );
};
