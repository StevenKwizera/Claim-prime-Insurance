import { ReactNode } from "react";

interface SectionCardProps {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
}

export const SectionCard = ({ title, description, action, children }: SectionCardProps) => (
  <section className="card p-4 sm:p-5">
    <div className="flex flex-col gap-2.5 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h3 className="text-lg font-bold text-slate-900">{title}</h3>
        {description ? <p className="mt-1.5 text-xs text-slate-500">{description}</p> : null}
      </div>
      {action}
    </div>
    <div className="mt-4">{children}</div>
  </section>
);
