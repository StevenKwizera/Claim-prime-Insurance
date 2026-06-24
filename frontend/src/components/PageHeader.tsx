import { ReactNode } from "react";

interface PageHeaderProps {
  eyebrow: string;
  title: string;
  description: string;
  actions?: ReactNode;
}

export const PageHeader = ({ eyebrow, title, description, actions }: PageHeaderProps) => (
  <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-hero-grid px-5 py-6 shadow-panel sm:px-8 sm:py-8">
    <div className="pointer-events-none absolute -right-20 -top-28 h-64 w-64 rounded-full bg-prime-400/15 blur-3xl" />
    <div className="pointer-events-none absolute -bottom-24 -left-12 h-52 w-52 rounded-full bg-gold-400/10 blur-3xl" />
    <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
      <div className="min-w-0 max-w-3xl">
        <p className="eyebrow">{eyebrow}</p>
        <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-navy-900 sm:text-3xl">{title}</h1>
        <p className="mt-3 text-sm leading-relaxed text-slate-600 sm:text-[0.95rem]">{description}</p>
      </div>
      {actions ? <div className="relative flex w-full flex-wrap gap-2 sm:w-auto sm:gap-3">{actions}</div> : null}
    </div>
  </div>
);
