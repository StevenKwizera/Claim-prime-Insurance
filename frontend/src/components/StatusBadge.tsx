import { ClaimStatus } from "@/types";
import { cn } from "@/utils/cn";

const styles: Record<ClaimStatus, string> = {
  Draft: "bg-slate-100 text-slate-700",
  Pending: "bg-amber-100 text-amber-800",
  "Under Review": "bg-blue-100 text-blue-800",
  Approved: "bg-emerald-100 text-emerald-800",
  Rejected: "bg-rose-100 text-rose-800",
  Investigation: "bg-violet-100 text-violet-800"
};

export const StatusBadge = ({ status }: { status: ClaimStatus }) => (
  <span className={cn("rounded-full px-3 py-1 text-xs font-semibold", styles[status])}>{status}</span>
);
