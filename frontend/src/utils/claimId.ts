/** Extract first claim reference like CLM-26601 from notification or message text. */
export function extractClaimId(text: string): string | null {
  const match = text.match(/CLM-\d+/i);
  return match ? match[0].toUpperCase() : null;
}

/** Match claimant-owned claims by logged-in display name. */
export function claimsForClaimantUser<T extends { claimantName: string }>(claims: T[], userName: string) {
  const normalized = userName.trim().toLowerCase();
  return claims.filter((c) => c.claimantName.trim().toLowerCase() === normalized);
}
