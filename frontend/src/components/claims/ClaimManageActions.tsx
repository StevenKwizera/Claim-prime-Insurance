import toast from "react-hot-toast";
import { Link, useNavigate } from "react-router-dom";
import { Pencil, Trash2 } from "lucide-react";
import { useDeleteClaim } from "@/hooks/useClaims";
import { Claim } from "@/types";
import { canClaimantDeleteClaim, canClaimantModifyClaim } from "@/utils/claimAccess";

type Props = {
  claim: Claim;
  layout?: "row" | "stack";
};

export const ClaimManageActions = ({ claim, layout = "row" }: Props) => {
  const navigate = useNavigate();
  const deleteClaim = useDeleteClaim();
  const canEdit = canClaimantModifyClaim(claim);
  const canDelete = canClaimantDeleteClaim(claim);

  if (!canEdit && !canDelete) {
    return (
      <p className="text-sm text-slate-500">
        This claim is locked after approval or investigation. Contact support if you need help.
      </p>
    );
  }

  const handleDelete = () => {
    const confirmed = window.confirm(
      `Delete claim ${claim.id}? This cannot be undone. Officers will no longer see this claim.`
    );
    if (!confirmed) {
      return;
    }
    deleteClaim.mutate(claim.id, {
      onSuccess: () => {
        toast.success("Claim deleted.");
        navigate("/tracking");
      },
      onError: () => toast.error("Could not delete this claim.")
    });
  };

  const className = layout === "stack" ? "flex flex-col gap-2" : "flex flex-wrap gap-3";

  return (
    <div className={className}>
      {canEdit ? (
        <Link to={`/claims/${claim.id}/edit`} className="btn-secondary inline-flex items-center gap-2">
          <Pencil className="h-4 w-4" />
          Edit claim
        </Link>
      ) : null}
      {canDelete ? (
        <button
          type="button"
          className="btn-danger inline-flex items-center gap-2"
          disabled={deleteClaim.isPending}
          onClick={handleDelete}
        >
          <Trash2 className="h-4 w-4" />
          {deleteClaim.isPending ? "Deleting..." : "Delete claim"}
        </button>
      ) : null}
    </div>
  );
};
