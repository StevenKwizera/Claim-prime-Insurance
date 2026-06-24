import { FormEvent, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Navigate } from "react-router-dom";
import { PageHeader } from "@/components/PageHeader";
import { useAuth } from "@/hooks/useAuth";
import {
  useAdminRequestPasswordResetEmail,
  useAdminResetUserPassword,
  useCreateStaffUser,
  useDeleteUser,
  useUpdateUser,
  useUsers
} from "@/hooks/useUsers";
import { User, UserRole } from "@/types";
import { formatRoleLabel } from "@/utils/format";

const staffRoles: Exclude<UserRole, "claimant">[] = [
  "agent",
  "officer",
  "supervisor",
  "fraud-investigator",
  "admin"
];

const allRoles: UserRole[] = ["claimant", ...staffRoles];

type EditForm = {
  name: string;
  email: string;
  phone: string;
  role: string;
  department: string;
  region: string;
  status: string;
};

export const UserManagementPage = () => {
  const { user: currentUser } = useAuth();
  const { data: users = [], error: usersError, isError: usersFailed, isLoading, refetch } = useUsers(true);
  const createStaffUser = useCreateStaffUser();
  const updateUser = useUpdateUser();
  const deleteUser = useDeleteUser();
  const adminReset = useAdminResetUserPassword();
  const adminResetEmail = useAdminRequestPasswordResetEmail();

  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | UserRole>("all");
  const [editing, setEditing] = useState<User | null>(null);
  const [editForm, setEditForm] = useState<EditForm | null>(null);
  const [resetTarget, setResetTarget] = useState<User | null>(null);
  const [tempPassword, setTempPassword] = useState("Prime@2026");
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    role: "officer" as Exclude<UserRole, "claimant">,
    department: "Claims Operations",
    region: "HQ",
    temporaryPassword: "Prime@2026"
  });

  if (currentUser && currentUser.role !== "admin") {
    return <Navigate to="/unauthorized" replace />;
  }

  const visibleUsers = useMemo(
    () =>
      users.filter((user) => {
        const matchesQuery = `${user.name} ${user.email} ${user.region} ${user.department ?? ""}`
          .toLowerCase()
          .includes(query.toLowerCase());
        const matchesRole = roleFilter === "all" || user.role === roleFilter;
        return matchesQuery && matchesRole;
      }),
    [query, roleFilter, users]
  );

  const openEdit = (user: User) => {
    setEditing(user);
    setEditForm({
      name: user.name,
      email: user.email,
      phone: user.phone ?? "",
      role: user.role,
      department: user.department ?? "",
      region: user.region,
      status: user.status ?? "Active"
    });
  };

  const saveEdit = (event: FormEvent) => {
    event.preventDefault();
    if (!editing || !editForm) return;
    updateUser.mutate(
      {
        id: editing.id,
        name: editForm.name,
        phone: editForm.phone,
        department: editForm.department,
        region: editForm.region,
        role: editForm.role,
        status: editForm.status
      },
      {
        onSuccess: () => {
          toast.success("User updated.");
          setEditing(null);
          setEditForm(null);
        },
        onError: (error) => toast.error(error instanceof Error ? error.message : "Update failed.")
      }
    );
  };

  const submitCreate = (event: FormEvent) => {
    event.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.phone.trim()) {
      toast.error("Name, email, and phone are required.");
      return;
    }
    createStaffUser.mutate(form, {
      onSuccess: () => {
        toast.success("User created. Check email for credentials when SMTP is on.");
        setForm({
          name: "",
          email: "",
          phone: "",
          role: "officer",
          department: "Claims Operations",
          region: "HQ",
          temporaryPassword: "Prime@2026"
        });
      },
      onError: (error) => toast.error(error instanceof Error ? error.message : "Could not create user.")
    });
  };

  const sendResetEmail = (target: User) => {
    adminResetEmail.mutate(target.id, {
      onSuccess: (result) => {
        toast.success(result.message, { duration: 6000 });
        if (!result.emailSent && result.devCode) {
          toast(`Reset code for ${target.email}: ${result.devCode}`, { duration: 12000, icon: "📧" });
        }
      },
      onError: (error) => toast.error(error instanceof Error ? error.message : "Could not send reset email.")
    });
  };

  const applyTempPassword = (event: FormEvent) => {
    event.preventDefault();
    if (!resetTarget) return;
    adminReset.mutate(
      { id: resetTarget.id, temporaryPassword: tempPassword },
      {
        onSuccess: (result) => {
          toast.success(result.message, { duration: 6000 });
          if (!result.emailSent && result.temporaryPassword) {
            toast(`Temporary password: ${result.temporaryPassword}`, { duration: 12000, icon: "🔑" });
          }
          setResetTarget(null);
        },
        onError: (error) => toast.error(error instanceof Error ? error.message : "Could not set password.")
      }
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Administration"
        title="User management"
        description="Full CRUD: create, edit, suspend, delete users. Send reset emails or set a temporary password."
        actions={
          <div className="flex flex-wrap gap-2">
            <button type="button" className="btn-secondary" onClick={() => refetch()}>
              Refresh list
            </button>
            <button
              type="button"
              className="btn-primary"
              onClick={() => document.getElementById("create-staff-user")?.scrollIntoView({ behavior: "smooth" })}
            >
              + Create user
            </button>
          </div>
        }
      />

      {isLoading ? <p className="text-sm text-slate-500">Loading users...</p> : null}

      {usersFailed ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
          {usersError instanceof Error ? usersError.message : "Unable to load users."}
          <p className="mt-2 text-xs">Sign in as admin (admin@prime.rw) and restart the backend: npm run backend</p>
        </div>
      ) : null}

      <div className="card p-4">
        <div className="grid gap-3 md:grid-cols-[1fr_12rem]">
          <input className="input" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search name, email, department..." />
          <select className="input" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value as "all" | UserRole)}>
            <option value="all">All roles</option>
            {allRoles.map((role) => (
              <option key={role} value={role}>
                {formatRoleLabel(role)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-blue-50 text-slate-700">
              <tr>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Department</th>
                <th className="px-4 py-3">Status</th>
                <th className="min-w-[280px] px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {visibleUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                    No users found.
                  </td>
                </tr>
              ) : (
                visibleUsers.map((user) => (
                  <tr key={user.id} className="border-t border-slate-100">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-navy-900">{user.name}</p>
                      <p className="text-xs text-slate-500">{user.email}</p>
                    </td>
                    <td className="px-4 py-3">{formatRoleLabel(user.role)}</td>
                    <td className="px-4 py-3 text-slate-600">{user.department ?? user.region}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                          user.status === "Suspended" || user.status === "Inactive"
                            ? "bg-rose-100 text-rose-800"
                            : user.status === "Pending"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-emerald-50 text-emerald-800"
                        }`}
                      >
                        {user.status ?? "Active"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1.5">
                        <button type="button" className="btn-secondary px-2 py-1 text-xs" onClick={() => openEdit(user)}>
                          Edit
                        </button>
                        <button
                          type="button"
                          className="btn-secondary px-2 py-1 text-xs"
                          onClick={() =>
                            updateUser.mutate(
                              { id: user.id, status: user.status === "Suspended" ? "Active" : "Suspended" },
                              {
                                onSuccess: () =>
                                  toast.success(user.status === "Suspended" ? "User activated." : "User suspended."),
                                onError: (e) => toast.error(e instanceof Error ? e.message : "Status update failed.")
                              }
                            )
                          }
                        >
                          {user.status === "Suspended" ? "Activate" : "Suspend"}
                        </button>
                        <button
                          type="button"
                          className="btn-primary px-2 py-1 text-xs"
                          disabled={adminResetEmail.isPending}
                          onClick={() => sendResetEmail(user)}
                        >
                          Email reset link
                        </button>
                        <button
                          type="button"
                          className="btn-gold px-2 py-1 text-xs"
                          onClick={() => {
                            setResetTarget(user);
                            setTempPassword("Prime@2026");
                          }}
                        >
                          Set temp password
                        </button>
                        <button
                          type="button"
                          className="btn-danger px-2 py-1 text-xs"
                          disabled={user.id === currentUser?.id}
                          onClick={() => {
                            if (!window.confirm(`Delete ${user.name}? This cannot be undone.`)) return;
                            deleteUser.mutate(user.id, {
                              onSuccess: () => toast.success("User deleted."),
                              onError: (e) => toast.error(e instanceof Error ? e.message : "Delete failed.")
                            });
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {editing && editForm ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/50 p-4">
          <form onSubmit={saveEdit} className="card max-h-[90vh] w-full max-w-lg overflow-y-auto p-6">
            <h3 className="text-xl font-bold text-navy-900">Edit user</h3>
            <div className="mt-4 grid gap-3">
              <input className="input" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} placeholder="Name" required />
              <input className="input" value={editForm.email} readOnly placeholder="Email" />
              <input className="input" value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} placeholder="Phone" />
              <select className="input" value={editForm.role} onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}>
                {allRoles.map((role) => (
                  <option key={role} value={role}>
                    {formatRoleLabel(role)}
                  </option>
                ))}
              </select>
              <input className="input" value={editForm.department} onChange={(e) => setEditForm({ ...editForm, department: e.target.value })} placeholder="Department" />
              <input className="input" value={editForm.region} onChange={(e) => setEditForm({ ...editForm, region: e.target.value })} placeholder="Region" />
              <select className="input" value={editForm.status} onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}>
                <option value="Active">Active</option>
                <option value="Pending">Pending</option>
                <option value="Suspended">Suspended</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
            <div className="mt-5 flex gap-3">
              <button type="submit" className="btn-primary" disabled={updateUser.isPending}>
                Save changes
              </button>
              <button type="button" className="btn-secondary" onClick={() => { setEditing(null); setEditForm(null); }}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      ) : null}

      {resetTarget ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/50 p-4">
          <form onSubmit={applyTempPassword} className="card w-full max-w-md p-6">
            <h3 className="text-xl font-bold text-navy-900">Set temporary password</h3>
            <p className="mt-2 text-sm text-slate-600">
              For <strong>{resetTarget.name}</strong> ({resetTarget.email}). Password is saved and emailed when SMTP works.
            </p>
            <input
              className="input mt-4"
              value={tempPassword}
              onChange={(e) => setTempPassword(e.target.value)}
              placeholder="Temporary password"
              required
            />
            <div className="mt-5 flex gap-3">
              <button type="submit" className="btn-primary" disabled={adminReset.isPending}>
                {adminReset.isPending ? "Saving..." : "Set password & notify"}
              </button>
              <button type="button" className="btn-secondary" onClick={() => setResetTarget(null)}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      ) : null}

      <form id="create-staff-user" onSubmit={submitCreate} className="card p-6">
        <h3 className="text-xl font-bold text-navy-900">Create staff user</h3>
        <p className="mt-2 text-sm text-slate-500">Creates account in database and emails temporary password when SMTP is enabled.</p>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Full name" required />
          <input className="input" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Work email" required />
          <input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="Phone" required />
          <select className="input" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as typeof form.role })}>
            {staffRoles.map((role) => (
              <option key={role} value={role}>
                {formatRoleLabel(role)}
              </option>
            ))}
          </select>
          <input className="input" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} placeholder="Department" />
          <input className="input" value={form.region} onChange={(e) => setForm({ ...form, region: e.target.value })} placeholder="Region" />
          <input className="input md:col-span-2" value={form.temporaryPassword} onChange={(e) => setForm({ ...form, temporaryPassword: e.target.value })} placeholder="Temporary password" />
        </div>
        <button className="btn-primary mt-5" type="submit" disabled={createStaffUser.isPending}>
          {createStaffUser.isPending ? "Creating..." : "Create user"}
        </button>
      </form>
    </div>
  );
};
