import { ReactNode } from "react";
import { Link } from "react-router-dom";
import authBg from "@/assets/auth-bg.png";
import primeLogo from "@/logo prime.jpeg";

interface AuthLayoutProps {
  title: string;
  description: string;
  children: ReactNode;
  footer?: ReactNode;
  wide?: boolean;
}

export const AuthLayout = ({ title, description, children, footer, wide }: AuthLayoutProps) => (
  <div className="auth-layout">
    <div
      className="auth-layout-visual"
      style={{ backgroundImage: `url(${authBg})` }}
      aria-hidden
    >
      <div className="auth-layout-visual-overlay" />
      <div className="auth-layout-visual-content">
        <img src={primeLogo} alt="" className="h-12 w-auto brightness-0 invert" />
        <p className="mt-8 text-sm font-bold uppercase tracking-[0.28em] text-prime-200">Prime Life Insurance</p>
        <h2 className="mt-4 max-w-md text-3xl font-extrabold leading-tight text-white sm:text-4xl">
          Claims made clear, secure, and fast.
        </h2>
        <p className="mt-4 max-w-sm text-sm leading-relaxed text-slate-300">
          Submit, track, and manage insurance claims with role-based dashboards built for customers and staff.
        </p>
      </div>
    </div>

    <div className="auth-layout-form">
      <div className={`auth-layout-panel ${wide ? "max-w-xl" : "max-w-md"}`}>
        <Link to="/" className="mb-6 inline-flex">
          <img src={primeLogo} alt="Prime Insurance" className="h-10 w-auto" />
        </Link>
        <h1 className="text-2xl font-extrabold text-navy-900">{title}</h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-500">{description}</p>
        <div className="mt-6">{children}</div>
        {footer ? <div className="mt-6 border-t border-slate-100 pt-6">{footer}</div> : null}
      </div>
    </div>
  </div>
);
