import { useEffect, useState } from "react";
import { DEMO_ACCOUNTS, DEMO_PASSWORD_HINT } from "@/constants/demoAccounts";
import { backendService } from "@/services/backend";
import { UserRole } from "@/types";
import { formatRoleLabel } from "@/utils/format";

interface DemoAccountPickerProps {
  onSelect: (email: string, password: string) => void;
}

type AccountRow = { email: string; name: string; role: UserRole; password: string };

export const DemoAccountPicker = ({ onSelect }: DemoAccountPickerProps) => {
  const [accounts, setAccounts] = useState<AccountRow[]>(
    DEMO_ACCOUNTS.map((a) => ({ ...a, name: formatRoleLabel(a.role) }))
  );
  const [fromDatabase, setFromDatabase] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    backendService
      .listDemoAccounts()
      .then((rows) => {
        if (cancelled || !rows.length) return;
        setAccounts(
          rows.map((row) => ({
            email: row.email,
            name: row.name,
            role: row.role,
            password: "password"
          }))
        );
        setFromDatabase(true);
      })
      .catch(() => {
        if (!cancelled) setFromDatabase(false);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
      <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
        {fromDatabase ? "Accounts from database" : "Demo accounts (offline list)"}
      </p>
      <p className="mt-1 text-xs text-slate-500">
        {fromDatabase
          ? "Only users saved in PostgreSQL can sign in. Seeded accounts use password: password"
          : `${DEMO_PASSWORD_HINT}. Start the backend to load live database users.`}
      </p>
      {loading ? <p className="mt-3 text-xs text-slate-400">Loading users from database…</p> : null}
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {accounts.map((account) => (
          <button
            key={account.email}
            type="button"
            onClick={() => onSelect(account.email, account.password)}
            className="rounded-xl border border-white bg-white px-3 py-2.5 text-left text-sm shadow-sm transition hover:border-prime-300 hover:ring-2 hover:ring-prime-100"
          >
            <span className="font-semibold text-navy-900">{formatRoleLabel(account.role)}</span>
            <span className="mt-0.5 block truncate text-xs text-slate-500">{account.email}</span>
            {fromDatabase ? (
              <span className="mt-0.5 block truncate text-[0.65rem] text-slate-400">{account.name}</span>
            ) : null}
          </button>
        ))}
      </div>
    </div>
  );
};
