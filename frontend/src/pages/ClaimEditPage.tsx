import { Link, Navigate, useParams } from "react-router-dom";
import { EmptyState } from "@/components/EmptyState";
import { LoadingState } from "@/components/LoadingState";
import { PageHeader } from "@/components/PageHeader";
import { useAuth } from "@/hooks/useAuth";
import { useClaim } from "@/hooks/useClaims";
import { ClaimSubmissionForm } from "@/modules/claims/ClaimSubmissionForm";
import { canClaimantModifyClaim, userOwnsClaim } from "@/utils/claimAccess";

export const ClaimEditPage = () => {
  const { claimId = "" } = useParams();
  const { user } = useAuth();
  const { data: claim, isLoading, isError } = useClaim(claimId);

  if (user?.role !== "claimant") {
    return <Navigate to={`/claims/${claimId}`} replace />;
  }

  if (isLoading) {
    return <LoadingState label="Loading claim for editing..." />;
  }

  if (isError || !claim || !userOwnsClaim(claim, user)) {
    return (
      <div className="space-y-4">
        <EmptyState title="Cannot edit this claim" description="It may not exist or does not belong to your account." />
        <Link to="/tracking" className="btn-primary inline-flex">
          Back to my claims
        </Link>
      </div>
    );
  }

  if (!canClaimantModifyClaim(claim)) {
    return (
      <div className="space-y-4">
        <EmptyState
          title="Editing not allowed"
          description="Approved, rejected (after decision), and investigation claims cannot be changed. You may still upload evidence if an officer requested it."
        />
        <Link to={`/claims/${claim.id}`} className="btn-primary inline-flex">
          View claim
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Edit claim"
        title={`Update ${claim.id}`}
        description="Change policy details, narrative, or add more documents. Status stays the same until an officer decides."
      />
      <ClaimSubmissionForm claimId={claim.id} />
    </div>
  );
};
