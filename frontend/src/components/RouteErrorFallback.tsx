import { isRouteErrorResponse, useRouteError, Link } from "react-router-dom";

export const RouteErrorFallback = () => {
  const error = useRouteError();
  const message = isRouteErrorResponse(error)
    ? error.statusText || "Page error"
    : error instanceof Error
      ? error.message
      : "Unexpected application error";

  return (
    <div className="grid min-h-screen place-items-center bg-slate-50 p-6">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
        <h1 className="text-xl font-bold text-slate-900">Something went wrong</h1>
        <p className="mt-3 text-sm leading-relaxed text-slate-600">{message}</p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <button type="button" className="btn-secondary" onClick={() => window.location.reload()}>
            Reload page
          </button>
          <Link to="/dashboard" className="btn-primary">
            Go to dashboard
          </Link>
        </div>
      </div>
    </div>
  );
};
