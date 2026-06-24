import { UserRole } from "@/types";

/** Paths any authenticated user may open */
const UNIVERSAL_PREFIXES = ["/dashboard", "/profile", "/settings", "/notifications", "/messages", "/help"];

/** Prefix → roles allowed (first match wins) */
const RESTRICTED_PREFIXES: Array<{ prefix: string; roles: UserRole[] }> = [
  { prefix: "/admin", roles: ["admin"] },
  { prefix: "/analytics", roles: ["supervisor", "admin"] },
  { prefix: "/reports/audit-trail", roles: ["admin"] },
  { prefix: "/reports", roles: ["supervisor", "admin", "officer", "agent", "fraud-investigator"] },
  { prefix: "/fraud", roles: ["fraud-investigator", "supervisor", "admin"] },
  { prefix: "/verification", roles: ["officer", "supervisor", "admin"] },
  { prefix: "/team/users", roles: ["officer", "supervisor", "admin", "fraud-investigator", "agent"] },
  { prefix: "/evaluation", roles: ["officer", "supervisor", "admin"] },
  {
    prefix: "/evidence",
    roles: ["claimant", "agent", "officer", "supervisor", "admin", "fraud-investigator"]
  },
  { prefix: "/claims/new", roles: ["claimant", "agent", "admin"] },
  { prefix: "/claims/drafts", roles: ["claimant", "agent", "admin"] },
  { prefix: "/claims/confirmation", roles: ["claimant", "agent", "admin"] },
  { prefix: "/claims/policy-lookup", roles: ["agent", "admin", "officer", "supervisor"] }
];

export function canAccessPath(pathname: string, role: UserRole): boolean {
  const path = pathname.split("?")[0];

  if (UNIVERSAL_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}/`))) {
    return true;
  }

  if (path.startsWith("/tracking") || path.startsWith("/claims/")) {
    const restricted = RESTRICTED_PREFIXES.find(
      ({ prefix }) => path === prefix || path.startsWith(`${prefix}/`)
    );
    if (restricted) {
      return restricted.roles.includes(role);
    }
    return true;
  }

  const rule = RESTRICTED_PREFIXES.find(
    ({ prefix }) => path === prefix || path.startsWith(`${prefix}/`)
  );
  if (rule) {
    return rule.roles.includes(role);
  }

  return true;
}
