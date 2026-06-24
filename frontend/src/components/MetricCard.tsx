import { LucideIcon, Minus, TrendingDown, TrendingUp } from "lucide-react";
import { ReactNode } from "react";

export type MetricCardVariant =
  | "forest"
  | "emerald"
  | "teal"
  | "mint"
  | "gold"
  | "amber"
  | "blue"
  | "violet"
  | "rose"
  | "slate";

interface MetricCardProps {
  title: string;
  value: string;
  detail: string;
  icon: LucideIcon;
  variant?: MetricCardVariant;
  trend?: { label: string; direction?: "up" | "down" | "neutral" };
}

const variantStyles: Record<
  MetricCardVariant,
  {
    card: string;
    icon: string;
    value: string;
    title: string;
    detail: string;
    trendUp: string;
    trendDown: string;
    trendNeutral: string;
  }
> = {
  forest: {
    card: "border-forest-600/30 bg-gradient-to-br from-forest-700 via-forest-800 to-forest-900 shadow-[0_8px_24px_rgba(10,31,23,0.18)]",
    icon: "bg-white/15 text-emerald-100 ring-white/20",
    value: "text-white",
    title: "text-emerald-100/85",
    detail: "text-emerald-200/70",
    trendUp: "text-emerald-300",
    trendDown: "text-rose-300",
    trendNeutral: "text-emerald-200/70"
  },
  emerald: {
    card: "border-emerald-200/80 bg-white shadow-[0_4px_18px_rgba(16,185,129,0.06)]",
    icon: "bg-forest-700 text-emerald-50 ring-forest-600/30",
    value: "text-forest-900",
    title: "text-slate-500",
    detail: "text-slate-500",
    trendUp: "text-emerald-600",
    trendDown: "text-rose-600",
    trendNeutral: "text-slate-500"
  },
  teal: {
    card: "border-teal-200/80 bg-white shadow-[0_4px_18px_rgba(20,184,166,0.06)]",
    icon: "bg-teal-700 text-teal-50 ring-teal-600/30",
    value: "text-forest-900",
    title: "text-slate-500",
    detail: "text-slate-500",
    trendUp: "text-teal-600",
    trendDown: "text-rose-600",
    trendNeutral: "text-slate-500"
  },
  mint: {
    card: "border-green-200/70 bg-white shadow-[0_4px_18px_rgba(34,197,94,0.05)]",
    icon: "bg-green-600 text-white ring-green-500/25",
    value: "text-forest-900",
    title: "text-slate-500",
    detail: "text-slate-500",
    trendUp: "text-green-600",
    trendDown: "text-rose-600",
    trendNeutral: "text-slate-500"
  },
  gold: {
    card: "border-amber-200/80 bg-white shadow-[0_4px_18px_rgba(201,162,39,0.07)]",
    icon: "bg-gold-600 text-white ring-gold-500/30",
    value: "text-forest-900",
    title: "text-slate-500",
    detail: "text-slate-500",
    trendUp: "text-emerald-600",
    trendDown: "text-rose-600",
    trendNeutral: "text-slate-500"
  },
  amber: {
    card: "border-orange-200/70 bg-white shadow-[0_4px_18px_rgba(245,158,11,0.06)]",
    icon: "bg-amber-600 text-white ring-amber-500/25",
    value: "text-forest-900",
    title: "text-slate-500",
    detail: "text-slate-500",
    trendUp: "text-emerald-600",
    trendDown: "text-rose-600",
    trendNeutral: "text-slate-500"
  },
  blue: {
    card: "border-blue-200/70 bg-white shadow-[0_4px_18px_rgba(59,130,246,0.06)]",
    icon: "bg-blue-600 text-white ring-blue-500/25",
    value: "text-forest-900",
    title: "text-slate-500",
    detail: "text-slate-500",
    trendUp: "text-emerald-600",
    trendDown: "text-rose-600",
    trendNeutral: "text-slate-500"
  },
  violet: {
    card: "border-violet-200/70 bg-white shadow-[0_4px_18px_rgba(139,92,246,0.06)]",
    icon: "bg-violet-600 text-white ring-violet-500/25",
    value: "text-forest-900",
    title: "text-slate-500",
    detail: "text-slate-500",
    trendUp: "text-emerald-600",
    trendDown: "text-rose-600",
    trendNeutral: "text-slate-500"
  },
  rose: {
    card: "border-rose-200/70 bg-white shadow-[0_4px_18px_rgba(244,63,94,0.06)]",
    icon: "bg-rose-600 text-white ring-rose-500/25",
    value: "text-forest-900",
    title: "text-slate-500",
    detail: "text-slate-500",
    trendUp: "text-emerald-600",
    trendDown: "text-rose-600",
    trendNeutral: "text-slate-500"
  },
  slate: {
    card: "border-slate-200/90 bg-white shadow-[0_4px_16px_rgba(15,23,42,0.05)]",
    icon: "bg-slate-600 text-white ring-slate-500/25",
    value: "text-forest-900",
    title: "text-slate-500",
    detail: "text-slate-500",
    trendUp: "text-emerald-600",
    trendDown: "text-rose-600",
    trendNeutral: "text-slate-500"
  }
};

function MiniBars({ variant }: { variant: MetricCardVariant }) {
  const bars =
    variant === "forest"
      ? ["h-3", "h-5", "h-4", "h-6", "h-3"]
      : ["h-2.5", "h-4", "h-3.5", "h-5", "h-2.5"];
  const tone =
    variant === "forest"
      ? "bg-emerald-300/70"
      : variant === "rose" || variant === "amber"
        ? "bg-current opacity-30"
        : "bg-forest-600/25";

  return (
    <div className={`flex items-end gap-0.5 ${variant === "forest" ? "" : "text-forest-700"}`}>
      {bars.map((height, index) => (
        <span key={index} className={`w-1 rounded-full ${tone} ${height}`} />
      ))}
    </div>
  );
}

export const MetricCard = ({
  title,
  value,
  detail,
  icon: Icon,
  variant = "emerald",
  trend
}: MetricCardProps) => {
  const styles = variantStyles[variant];
  const TrendIcon =
    trend?.direction === "up" ? TrendingUp : trend?.direction === "down" ? TrendingDown : Minus;
  const trendClass =
    trend?.direction === "up"
      ? styles.trendUp
      : trend?.direction === "down"
        ? styles.trendDown
        : styles.trendNeutral;

  return (
    <article
      className={`metric-card group rounded-2xl border p-3.5 transition duration-200 hover:-translate-y-0.5 hover:shadow-md ${styles.card}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl shadow-sm ring-1 ${styles.icon}`}>
          <Icon className="h-4 w-4" strokeWidth={2.1} />
        </div>
        <div className="hidden sm:block">
          <MiniBars variant={variant} />
        </div>
      </div>

      <div className="mt-3 flex items-end justify-between gap-2">
        <div className="min-w-0">
          <p className={`text-[0.68rem] font-bold uppercase tracking-[0.14em] ${styles.title}`}>{title}</p>
          <p className={`mt-1 text-2xl font-extrabold tabular-nums leading-none tracking-tight sm:text-[1.5rem] ${styles.value}`}>
            {value}
          </p>
        </div>
      </div>

      <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2">
        <p className={`text-xs leading-snug ${styles.detail}`}>{detail}</p>
        {trend ? (
          <span className={`inline-flex items-center gap-1 text-[0.68rem] font-semibold ${trendClass}`}>
            <TrendIcon className="h-3.5 w-3.5 shrink-0" />
            {trend.label}
          </span>
        ) : null}
      </div>
    </article>
  );
};

export const MetricCardGrid = ({
  children,
  columns = 4
}: {
  children: ReactNode;
  columns?: 2 | 3 | 4 | 6;
}) => {
  const columnClass =
    columns === 2
      ? "sm:grid-cols-2"
      : columns === 3
        ? "sm:grid-cols-2 lg:grid-cols-3"
        : columns === 6
          ? "grid-cols-2 sm:grid-cols-3 xl:grid-cols-6"
          : "sm:grid-cols-2 xl:grid-cols-4";

  return <div className={`grid grid-cols-1 gap-3 sm:gap-4 ${columnClass}`}>{children}</div>;
};
