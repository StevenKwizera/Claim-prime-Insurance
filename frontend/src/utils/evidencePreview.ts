import { ClaimDocument, ClaimType } from "@/types";
import { DEMO_EVIDENCE_VIDEO_URL, resolveProjectEvidenceUrl } from "@/config/evidenceMedia";
import { isImageDocument, isVideoDocument } from "@/utils/claimAccess";

export { DEMO_EVIDENCE_VIDEO_URL };

export function resolveEvidencePreviewUrl(
  claimId: string,
  document: ClaimDocument,
  claimType?: ClaimType
): string | undefined {
  const direct = document.previewUrl?.trim();
  if (direct) {
    return direct;
  }
  return resolveProjectEvidenceUrl(
    claimId,
    {
      id: document.id,
      name: document.name,
      kind: document.kind,
      tag: document.tag
    },
    claimType
  );
}
