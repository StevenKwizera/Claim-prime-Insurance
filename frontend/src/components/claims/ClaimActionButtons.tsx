import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useClaimAction } from "@/hooks/useClaims";
import { ClaimAction } from "@/services/backend";
import axios from "axios";
import { Claim } from "@/types";

type Props = {
  claim: Claim | undefined;
  layout?: "wrap" | "stack";
  showInvestigate?: boolean;
  showOpenLink?: boolean;
};

export const ClaimActionButtons = ({
  claim,
  layout = "wrap",
  showInvestigate = false,
  showOpenLink = true
}: Props) => {
  const { user } = useAuth();
  const claimAction = useClaimAction();
  const actor = user?.name ?? "System User";

  const run = (action: ClaimAction, successMessage: string, message?: string) => {
    if (!claim) {
      toast.error("Select a claim first.");
      return;
    }
    claimAction.mutate(
      { claimId: claim.id, action, actor, message },
      {
        onSuccess: () => toast.success(successMessage),
        onError: (error: unknown) => {
          let message = "Could not update the claim. Try again.";
          if (error instanceof Error) {
            message = error.message;
          } else if (axios.isAxiosError(error) && error.response?.status === 401) {
            message = "Session expired. Sign in again, then retry.";
          }
          toast.error(message);
        }
      }
    );
  };

  const requestInfo = () => {
    if (!claim) {
      toast.error("Select a claim first.");
      return;
    }
    const message = window.prompt(
      "What should the claimant provide? (e.g. garage quotation, extra photos)",
      "Please confirm repair garage details and upload quotation PDF or photos."
    );
    if (message === null) return;
    if (!message.trim()) {
      toast.error("Enter a short message for the claimant.");
      return;
    }
    run("request-info", "Information request sent to claimant.", message.trim());
  };

  const containerClass = layout === "stack" ? "flex flex-col gap-2" : "flex flex-wrap gap-3";
  const decisionLocked = claim?.status === "Approved" || claim?.status === "Rejected";

  return (
    <div className={containerClass}>
      {decisionLocked ? (
        <p className="w-full text-sm text-slate-500">This claim already has a final decision ({claim?.status}).</p>
      ) : null}
      <button
        type="button"
        className="btn-primary"
        disabled={!claim || claimAction.isPending || decisionLocked}
        onClick={() => run("approve", "Claim approved.")}
      >
        Approve
      </button>
      <button
        type="button"
        className="btn-danger"
        disabled={!claim || claimAction.isPending || decisionLocked}
        onClick={() => run("reject", "Claim rejected.")}
      >
        Reject
      </button>
      <button type="button" className="btn-secondary" disabled={!claim || claimAction.isPending} onClick={requestInfo}>
        Request info
      </button>
      <button type="button" className="btn-secondary" disabled={!claim || claimAction.isPending} onClick={() => run("escalate", "Claim escalated to supervisor.")}>
        Escalate
      </button>
      {showInvestigate ? (
        <button type="button" className="btn-gold" disabled={!claim || claimAction.isPending} onClick={() => run("investigate", "Fraud investigation started.")}>
          Investigate
        </button>
      ) : null}
      {showOpenLink && claim ? (
        <Link to={`/claims/${claim.id}`} className="btn-secondary">
          Open full workspace
        </Link>
      ) : null}
    </div>
  );
};
