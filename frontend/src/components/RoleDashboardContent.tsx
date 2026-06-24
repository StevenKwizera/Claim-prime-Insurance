import { AdminDashboard } from "@/components/AdminDashboard";
import {
  AgentDashboard,
  ClaimantDashboard,
  FraudDashboard,
  SupervisorDashboard
} from "@/components/dashboards/RoleDashboards";
import { OfficerDashboard } from "@/components/dashboards/OfficerDashboard";
import { User, Claim } from "@/types";

export const RoleDashboardContent = ({ user, claims, users = [] }: { user: User; claims: Claim[]; users?: User[] }) => {
  switch (user.role) {
    case "admin":
      return <AdminDashboard users={users} claims={claims} />;
    case "claimant":
      return <ClaimantDashboard user={user} claims={claims} />;
    case "agent":
      return <AgentDashboard claims={claims} />;
    case "officer":
      return <OfficerDashboard user={user} claims={claims} />;
    case "supervisor":
      return <SupervisorDashboard claims={claims} />;
    case "fraud-investigator":
      return <FraudDashboard claims={claims} />;
    default:
      return null;
  }
};
