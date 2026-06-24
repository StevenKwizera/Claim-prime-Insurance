import { Link } from "react-router-dom";
import { LoadingState } from "@/components/LoadingState";
import { PageHeader } from "@/components/PageHeader";
import { RoleDashboardContent } from "@/components/RoleDashboardContent";
import { SlaWorkloadPanel } from "@/components/SlaWorkloadPanel";
import { useAuth } from "@/hooks/useAuth";
import { useClaims } from "@/hooks/useClaims";
import { useUsers } from "@/hooks/useUsers";
import { ClaimsTable } from "@/modules/claims/ClaimsTable";
import { formatRoleLabel } from "@/utils/format";
import { UserRole } from "@/types";

const roleHeaders: Partial<Record<UserRole, { title: string; description: string }>> = {
  claimant: {
    title: "My claims portal",
    description: "Submit claims, upload evidence, track status, and respond to officer requests."
  },
  agent: { title: "Claim intake support", description: "Assist customers with submission, evidence upload, and tracking." },
  supervisor: { title: "Supervisor oversight", description: "Escalations, analytics, and reports across the verification pipeline." },
  "fraud-investigator": {
    title: "Investigator workspace",
    description: "Review flagged claims, investigate fraud alerts, and report findings."
  }
};

export const HomePage = () => {
  const { data: claims = [], isLoading } = useClaims();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const { data: users = [] } = useUsers(isAdmin);

  if (isLoading || !user) {
    return <LoadingState label="Loading your workspace..." />;
  }

  const header = roleHeaders[user.role];

  return (
    <div className="space-y-6">
      {!isAdmin && header ? (
        <PageHeader
          eyebrow={formatRoleLabel(user.role)}
          title={header.title}
          description={header.description}
          actions={
            user.role === "claimant" || user.role === "agent" ? (
              <Link to="/claims/new" className="btn-primary">
                {user.role === "agent" ? "Assist claim" : "New claim"}
              </Link>
            ) : undefined
          }
        />
      ) : null}

      {user.role !== "claimant" && user.role !== "admin" && user.status === "Pending" ? (
        <div className="card border-amber-200 bg-amber-50/90 p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-semibold text-slate-900">Complete your account setup</p>
              <p className="mt-1 text-sm text-slate-600">Use the temporary password from your email, then set your own password.</p>
            </div>
            <Link to="/forgot-password" className="btn-primary shrink-0">
              Reset password
            </Link>
          </div>
        </div>
      ) : null}

      <RoleDashboardContent user={user} claims={claims} users={users} />

      {user.role === "supervisor" ? (
        <>
          <SlaWorkloadPanel claims={claims} />
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-xl font-bold text-navy-900">Team claims overview</h3>
              <div className="flex flex-wrap gap-2">
                <Link to="/verification/all-claims" className="btn-secondary">
                  Full claims table
                </Link>
                <Link to="/team/users" className="btn-secondary">
                  System users
                </Link>
              </div>
            </div>
            <ClaimsTable claims={claims} />
          </div>
        </>
      ) : null}

      {user.role === "officer" ? (
        <div className="flex justify-end">
          <Link to="/verification/all-claims" className="text-sm font-semibold text-prime-600 hover:underline">
            Open full claims registry →
          </Link>
        </div>
      ) : null}

      {user.role === "fraud-investigator" ? (
        <div className="space-y-3">
          <h3 className="text-xl font-bold text-navy-900">High-risk claims</h3>
          <ClaimsTable claims={claims.filter((c) => c.riskScore >= 25)} />
        </div>
      ) : null}
    </div>
  );
};
