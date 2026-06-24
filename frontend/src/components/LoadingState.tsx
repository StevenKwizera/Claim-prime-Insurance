export const LoadingState = ({ label = "Loading..." }: { label?: string }) => (
  <div className="card p-6">
    <div className="animate-pulse space-y-3">
      <div className="h-4 w-32 rounded-full bg-slate-200" />
      <div className="h-8 w-72 rounded-full bg-slate-200" />
      <div className="h-24 rounded-3xl bg-slate-100" />
    </div>
    <p className="mt-4 text-sm text-slate-500">{label}</p>
  </div>
);
