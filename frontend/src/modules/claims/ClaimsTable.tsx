import { Link } from "react-router-dom";
import { StatusBadge } from "@/components/StatusBadge";
import { Claim } from "@/types";
import { formatDate } from "@/utils/format";

export const ClaimsTable = ({ claims }: { claims: Claim[] }) => (
  <div className="card overflow-hidden">
    <div className="overflow-x-auto">
      <table className="min-w-full text-left text-sm">
        <thead className="bg-slate-50 text-slate-500">
          <tr>
            <th className="px-6 py-4">Claim</th>
            <th className="px-6 py-4">Type</th>
            <th className="px-6 py-4">Status</th>
            <th className="px-6 py-4">Submitted</th>
            <th className="px-6 py-4"></th>
          </tr>
        </thead>
        <tbody>
          {claims.map((claim) => (
            <tr key={claim.id} className="border-t border-slate-100">
              <td className="px-6 py-4">
                <p className="font-semibold text-slate-900">{claim.id}</p>
                <p className="text-slate-500">{claim.claimantName}</p>
              </td>
              <td className="px-6 py-4 capitalize text-slate-700">{claim.type}</td>
              <td className="px-6 py-4">
                <StatusBadge status={claim.status} />
              </td>
              <td className="px-6 py-4 text-slate-700">{formatDate(claim.submittedAt)}</td>
              <td className="px-6 py-4">
                <Link className="font-semibold text-prime-600" to={`/claims/${claim.id}`}>
                  Open workspace
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);
