import { Claim } from "@/types";
import { User } from "@/types";
import { claimsForClaimantUser } from "@/utils/claimId";

export function filterClaimsForUser(claims: Claim[], user: User | null | undefined): Claim[] {
  if (!user) {
    return [];
  }
  if (user.role === "claimant") {
    return claimsForClaimantUser(claims, user.name);
  }
  return claims;
}

export function userOwnsClaim(claim: Claim | undefined, user: User | null | undefined): boolean {
  if (!claim || !user) {
    return false;
  }
  if (user.role !== "claimant") {
    return true;
  }
  return claim.claimantName.trim().toLowerCase() === user.name.trim().toLowerCase();
}

export function flattenClaimEvidence(claims: Claim[]) {
  return claims.flatMap((claim) =>
    claim.documents.map((doc) => ({
      ...doc,
      claimId: claim.id,
      claimStatus: claim.status,
      claimType: claim.type
    }))
  );
}

export function isImageDocument(doc: { kind: string; name: string }): boolean {
  return doc.kind === "image" || /\.(jpe?g|png|gif|webp|bmp)$/i.test(doc.name);
}

export function isVideoDocument(doc: { kind: string; name: string }): boolean {
  return doc.kind === "video" || /\.(mp4|webm|mov|m4v)$/i.test(doc.name);
}

export function isPdfDocument(doc: { kind: string; name: string }): boolean {
  return doc.kind === "pdf" || /\.pdf$/i.test(doc.name);
}

const CLAIMANT_MODIFIABLE_STATUSES = ["Draft", "Pending", "Under Review"] as const;
const CLAIMANT_DELETABLE_STATUSES = ["Draft", "Pending", "Under Review", "Rejected"] as const;

export function canClaimantModifyClaim(claim: Claim): boolean {
  return CLAIMANT_MODIFIABLE_STATUSES.includes(claim.status as (typeof CLAIMANT_MODIFIABLE_STATUSES)[number]);
}

export function canClaimantDeleteClaim(claim: Claim): boolean {
  return CLAIMANT_DELETABLE_STATUSES.includes(claim.status as (typeof CLAIMANT_DELETABLE_STATUSES)[number]);
}
