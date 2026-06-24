import { Link } from "react-router-dom";
import { EvidenceManageCard } from "@/components/evidence/EvidenceManageCard";
import { MetricCard, MetricCardGrid } from "@/components/MetricCard";
import { SectionCard } from "@/components/SectionCard";
import { Claim, User } from "@/types";
import { flattenClaimEvidence } from "@/utils/claimAccess";
import { claimsForClaimantUser } from "@/utils/claimId";
import { formatDate } from "@/utils/format";
import {
  Activity,
  BadgeCheck,
  ClipboardCheck,
  Clock3,
  FileDigit,
  FolderClock,
  SearchCheck,
  ShieldAlert,
  Siren,
  UserCog,
  Bell
} from "lucide-react";

export const ClaimantDashboard = ({ user, claims }: { user: User; claims: Claim[] }) => {
  const mine = claimsForClaimantUser(claims, user.name);
  const drafts = mine.filter((c) => c.status === "Draft").length;
  const evidence = flattenClaimEvidence(mine).slice(0, 8);

  return (
    <div className="space-y-6">
      <div className="dashboard-stat-band">
        <MetricCardGrid columns={3}>
          <MetricCard
            title="My claims"
            value={String(mine.length)}
            detail="Submitted and in progress"
            icon={FolderClock}
            variant="forest"
            trend={{ label: "Active portfolio", direction: "up" }}
          />
          <MetricCard
            title="Drafts"
            value={String(drafts)}
            detail="Resume anytime"
            icon={FileDigit}
            variant="teal"
            trend={{ label: `${drafts} saved`, direction: drafts > 0 ? "up" : "neutral" }}
          />
          <MetricCard
            title="Decisions"
            value={String(mine.filter((c) => c.status === "Approved" || c.status === "Rejected").length)}
            detail="Approved or rejected"
            icon={Bell}
            variant="gold"
            trend={{ label: "Final outcomes", direction: "neutral" }}
          />
        </MetricCardGrid>
      </div>
      <SectionCard title="Your next steps" action={<Link to="/claims/new" className="btn-primary">Submit New Claim</Link>}>
        <div className="grid gap-3 sm:grid-cols-2">
          <ActionLink to="/claims/new" label="Submit New Claim" />
          <ActionLink to="/tracking" label="My Claims / Track Status" />
          <ActionLink to="/claims/drafts" label="Saved drafts" />
          <ActionLink to="/evidence/upload" label="Upload evidence" />
        </div>
        <div className="mt-4 space-y-2">
          {mine.slice(0, 5).map((c) => (
            <div key={c.id} className="action-tile flex flex-wrap items-center justify-between gap-2">
              <Link to={`/claims/${c.id}`} className="font-medium text-slate-900 hover:text-prime-700">
                {c.id} · {c.status} · due {formatDate(c.estimatedCompletion)}
              </Link>
              {c.status === "Draft" || c.status === "Under Review" || c.status === "Pending" ? (
                <Link to={`/claims/${c.id}/edit`} className="text-xs font-semibold text-prime-600 hover:underline">
                  Edit
                </Link>
              ) : null}
            </div>
          ))}
        </div>
      </SectionCard>
      <SectionCard
        title="My evidence photos & documents"
        description="Add, replace, or remove images and documents on your claims. Officers see the same files when they review."
        action={<Link to="/evidence/upload" className="btn-secondary">Upload evidence</Link>}
      >
        {evidence.length === 0 ? (
          <p className="text-sm text-slate-500">No evidence uploaded yet. Use Upload evidence after submitting a claim.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {evidence.map((item) => (
              <EvidenceManageCard
                key={`${item.claimId}-${item.id}`}
                claimId={item.claimId}
                document={item}
                claimType={item.claimType}
              />
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
};

export const AgentDashboard = ({ claims }: { claims: Claim[] }) => {
  const drafts = claims.filter((c) => c.status === "Draft");

  return (
    <div className="space-y-6">
      <div className="dashboard-stat-band">
        <MetricCardGrid columns={3}>
          <MetricCard title="Open drafts" value={String(drafts.length)} detail="Need agent follow-up" icon={FolderClock} variant="amber" trend={{ label: "Intake queue", direction: "up" }} />
          <MetricCard title="Active claims" value={String(claims.length)} detail="In the system" icon={ClipboardCheck} variant="emerald" trend={{ label: "Live cases", direction: "neutral" }} />
          <MetricCard title="Today's assists" value="—" detail="Policy lookups & intake" icon={SearchCheck} variant="blue" trend={{ label: "Support desk", direction: "neutral" }} />
        </MetricCardGrid>
      </div>
      <SectionCard title="Agent actions" action={<Link to="/claims/policy-lookup" className="btn-primary">Policy lookup</Link>}>
        <div className="grid gap-3 sm:grid-cols-2">
          <ActionLink to="/claims/new" label="Assist new claim" />
          <ActionLink to="/claims/drafts" label="Review drafts" />
          <ActionLink to="/evidence/upload" label="Upload evidence" />
          <ActionLink to="/tracking" label="Client tracking" />
        </div>
      </SectionCard>
    </div>
  );
};

export const SupervisorDashboard = ({ claims }: { claims: Claim[] }) => {
  const escalated = claims.filter((c) => c.riskScore > 20);

  return (
    <div className="space-y-6">
      <div className="dashboard-stat-band">
        <MetricCardGrid columns={3}>
          <MetricCard title="Escalated" value={String(escalated.length)} detail="Needs supervisor" icon={ShieldAlert} variant="rose" trend={{ label: "Priority", direction: "up" }} />
          <MetricCard title="SLA risk" value="2" detail="Near breach" icon={Clock3} variant="amber" trend={{ label: "Watch list", direction: "down" }} />
          <MetricCard title="Team load" value="4" detail="Officers active" icon={UserCog} variant="violet" trend={{ label: "On duty", direction: "neutral" }} />
        </MetricCardGrid>
      </div>
      <SectionCard title="Supervisor actions" action={<Link to="/evaluation/escalations" className="btn-primary">Escalations</Link>}>
        <div className="grid gap-3 sm:grid-cols-2">
          <ActionLink to="/evaluation/escalations" label="Escalation queue" />
          <ActionLink to="/analytics" label="Analytics hub" />
          <ActionLink to="/reports" label="Reports" />
          <ActionLink to="/fraud" label="Fraud overview" />
        </div>
      </SectionCard>
    </div>
  );
};

export const FraudDashboard = ({ claims }: { claims: Claim[] }) => {
  const flagged = claims.filter((c) => c.riskScore >= 25);

  return (
    <div className="space-y-6">
      <div className="dashboard-stat-band">
        <MetricCardGrid columns={3}>
          <MetricCard title="Flagged claims" value={String(flagged.length)} detail="Investigation queue" icon={Siren} variant="forest" trend={{ label: "Open flags", direction: "up" }} />
          <MetricCard title="High risk" value={String(claims.filter((c) => c.riskScore >= 40).length)} detail="Priority cases" icon={ShieldAlert} variant="rose" trend={{ label: "Score ≥ 40", direction: "up" }} />
          <MetricCard title="Open cases" value="2" detail="In progress" icon={ClipboardCheck} variant="slate" trend={{ label: "Active reviews", direction: "neutral" }} />
        </MetricCardGrid>
      </div>
      <SectionCard title="Investigator actions" action={<Link to="/fraud/investigator-workspace" className="btn-gold">Workspace</Link>}>
        <div className="grid gap-3 sm:grid-cols-2">
          <ActionLink to="/fraud/flagged-claims" label="Flagged queue" />
          <ActionLink to="/fraud/investigator-workspace" label="Investigation workspace" />
          <ActionLink to="/fraud/risk-scoring" label="AI risk scores" />
          <ActionLink to="/evidence/gallery" label="Evidence gallery" />
        </div>
        <div className="mt-4 space-y-2">
          {flagged.slice(0, 5).map((c) => (
            <Link key={c.id} to={`/claims/${c.id}`} className="action-tile block">
              {c.id} · risk {c.riskScore} · {c.region}
            </Link>
          ))}
        </div>
      </SectionCard>
    </div>
  );
};

const ActionLink = ({ to, label }: { to: string; label: string }) => (
  <Link to={to} className="action-tile block text-center">
    {label}
  </Link>
);
