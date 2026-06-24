import { useMemo, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { useUserDirectory } from "@/hooks/useUsers";
import { UserRole } from "@/types";
import { formatRoleLabel } from "@/utils/format";

export const TeamDirectoryPage = () => {
  const { data: users = [], isLoading, isError } = useUserDirectory();
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | UserRole>("all");

  const filtered = useMemo(
    () =>
      users.filter((user) => {
        const q = query.trim().toLowerCase();
        const matchesQuery =
          !q ||
          user.name.toLowerCase().includes(q) ||
          user.email.toLowerCase().includes(q) ||
          (user.department ?? "").toLowerCase().includes(q);
        const matchesRole = roleFilter === "all" || user.role === roleFilter;
        return matchesQuery && matchesRole;
      }),
    [users, query, roleFilter]
  );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="People"
        title="Users in the system"
        description="All registered claimants and staff accounts (read-only directory)."
      />

      <div className="card flex flex-wrap gap-3 p-4">
        <input
          className="input min-w-[220px] flex-1"
          placeholder="Search name, email, department…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <select
          className="input w-auto"
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value as "all" | UserRole)}
        >
          <option value="all">All roles</option>
          <option value="claimant">Claimant</option>
          <option value="agent">Agent</option>
          <option value="officer">Officer</option>
          <option value="supervisor">Supervisor</option>
          <option value="fraud-investigator">Fraud investigator</option>
          <option value="admin">Admin</option>
        </select>
      </div>

      <div className="card overflow-hidden">
        {isLoading ? (
          <p className="p-6 text-sm text-slate-500">Loading users…</p>
        ) : isError ? (
          <p className="p-6 text-sm text-rose-600">Could not load users. Sign in and ensure the backend is running.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">Email</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4">Region</th>
                  <th className="px-6 py-4">Department</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((user) => (
                  <tr key={user.id} className="border-t border-slate-100">
                    <td className="px-6 py-4 font-semibold text-slate-900">{user.name}</td>
                    <td className="px-6 py-4 text-slate-700">{user.email}</td>
                    <td className="px-6 py-4 text-slate-700">{formatRoleLabel(user.role)}</td>
                    <td className="px-6 py-4 text-slate-700">{user.region}</td>
                    <td className="px-6 py-4 text-slate-700">{user.department ?? "—"}</td>
                    <td className="px-6 py-4 text-slate-700">{user.status ?? "Active"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!filtered.length ? <p className="p-6 text-sm text-slate-500">No users match your filters.</p> : null}
          </div>
        )}
      </div>
    </div>
  );
};
