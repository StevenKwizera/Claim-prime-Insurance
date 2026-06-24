import { Claim, ClaimType } from "@/types";

export type ClaimTypeFilter = "all" | ClaimType;

export const CLAIM_TYPE_ORDER: ClaimType[] = ["auto", "health", "property"];

export const claimTypeLabel = (type: ClaimType | string): string => {
  switch (type) {
    case "auto":
      return "Motor / auto";
    case "health":
      return "Health";
    case "property":
      return "Property";
    default:
      return type;
  }
};

export const claimTypeShortLabel = (type: ClaimType): string => {
  switch (type) {
    case "auto":
      return "Motor";
    case "health":
      return "Health";
    case "property":
      return "Property";
  }
};

export function countClaimsByType(claims: Claim[]): Record<ClaimTypeFilter, number> {
  const auto = claims.filter((c) => c.type === "auto").length;
  const health = claims.filter((c) => c.type === "health").length;
  const property = claims.filter((c) => c.type === "property").length;
  return {
    all: claims.length,
    auto,
    health,
    property
  };
}

export function filterClaimsByType(claims: Claim[], typeFilter: ClaimTypeFilter): Claim[] {
  if (typeFilter === "all") {
    return claims;
  }
  return claims.filter((claim) => claim.type === typeFilter);
}

export function groupClaimsByType(claims: Claim[]): Record<ClaimType, Claim[]> {
  return {
    auto: claims.filter((c) => c.type === "auto"),
    health: claims.filter((c) => c.type === "health"),
    property: claims.filter((c) => c.type === "property")
  };
}

export function sortClaimsNewestFirst(claims: Claim[]): Claim[] {
  return [...claims].sort(
    (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
  );
}
