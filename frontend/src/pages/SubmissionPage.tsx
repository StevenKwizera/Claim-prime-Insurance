import { PageHeader } from "@/components/PageHeader";
import { ClaimSubmissionForm } from "@/modules/claims/ClaimSubmissionForm";

export const SubmissionPage = () => (
  <div className="space-y-6">
    <PageHeader
      eyebrow="Digital Claim Submission"
      title="Start, save, and submit a claim"
      description="A structured multi-step flow with dynamic fields, validation, file uploads, and policy auto-fill support."
    />
    <ClaimSubmissionForm />
  </div>
);
