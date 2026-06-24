import { LucideIcon } from "lucide-react";

export const EmptyState = ({
  title,
  description,
  icon: Icon
}: {
  title: string;
  description: string;
  icon?: LucideIcon;
}) => (
  <div className="rounded-3xl border border-dashed border-slate-200 bg-gradient-to-br from-slate-50 to-white px-6 py-14 text-center shadow-inner">
    {Icon ? (
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-prime-100 text-prime-700">
        <Icon className="h-7 w-7" strokeWidth={1.75} />
      </div>
    ) : null}
    <p className={`text-lg font-semibold text-slate-900 ${Icon ? "mt-5" : ""}`}>{title}</p>
    <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-slate-500">{description}</p>
  </div>
);
