import clsx from "clsx";
import { ClaimTypeFilter, claimTypeShortLabel, countClaimsByType } from "@/utils/claimGrouping";
import { Claim } from "@/types";

type Props = {
  claims: Claim[];
  value: ClaimTypeFilter;
  onChange: (value: ClaimTypeFilter) => void;
  className?: string;
};

const tabs: ClaimTypeFilter[] = ["all", "auto", "health", "property"];

export const ClaimTypeFilterTabs = ({ claims, value, onChange, className }: Props) => {
  const counts = countClaimsByType(claims);

  return (
    <div className={clsx("flex flex-wrap gap-2", className)}>
      {tabs.map((tab) => {
        const active = value === tab;
        const label = tab === "all" ? "All claims" : claimTypeShortLabel(tab);
        return (
          <button
            key={tab}
            type="button"
            onClick={() => onChange(tab)}
            className={clsx(
              "rounded-full px-4 py-2 text-sm font-semibold transition",
              active
                ? "bg-prime-600 text-white shadow-sm"
                : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
            )}
          >
            {label}
            <span className={clsx("ml-1.5 tabular-nums", active ? "text-prime-100" : "text-slate-400")}>
              ({counts[tab]})
            </span>
          </button>
        );
      })}
    </div>
  );
};
