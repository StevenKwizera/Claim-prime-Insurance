import { ChangeEvent, FormEvent, ReactNode, useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  Bot,
  BrainCircuit,
  Building2,
  CheckCircle2,
  Clock3,
  FileDigit,
  FileSearch,
  Files,
  Gauge,
  MailCheck,
  Network,
  ScanSearch,
  ShieldCheck,
  ShieldQuestion,
  Siren,
  UserRoundCog,
  Users
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { AuthLayout } from "@/components/AuthLayout";
import { SystemHelpChat } from "@/components/SystemHelpChat";
import { PageHeader } from "@/components/PageHeader";
import { MetricCard, MetricCardGrid } from "@/components/MetricCard";
import { SectionCard } from "@/components/SectionCard";
import { ClaimsTable } from "@/modules/claims/ClaimsTable";
import { demoUsers, mockClaims, mockNotifications } from "@/services/mockData";
import { useClaimsStore } from "@/store/claimsStore";
import { UserRole } from "@/types";
import { formatDate } from "@/utils/format";
import primeLogo from "@/logo prime.jpeg";
import { downloadCsv } from "@/utils/download";
import { ClaimActionButtons } from "@/components/claims/ClaimActionButtons";
import { ClaimQueueList } from "@/components/claims/ClaimQueueList";
import { ClaimEvidenceGallery } from "@/components/evidence/ClaimEvidenceGallery";
import { EvidenceManageCard } from "@/components/evidence/EvidenceManageCard";
import { EvidenceThumbnail } from "@/components/evidence/EvidenceThumbnail";
import {
  useAddClaimNote,
  useClaim,
  useClaimAction,
  useClaims,
  useCreateNotification,
  useMarkNotificationRead,
  useNotifications,
  useUploadEvidence
} from "@/hooks/useClaims";
import { useAuth } from "@/hooks/useAuth";
import { classifyUpload } from "@/utils/documentAI";
import { useRegisterClaimant } from "@/hooks/useUsers";
import { backendService } from "@/services/backend";

const filters = (
  <div className="flex flex-wrap gap-3">
    <input className="input max-w-xs" placeholder="Search records" />
    <select className="input max-w-xs">
      <option>All regions</option>
      <option>Kigali</option>
      <option>Northern</option>
      <option>Western</option>
    </select>
    <button
      className="btn-secondary"
      type="button"
      onClick={() =>
        downloadCsv(`claims-export-${new Date().toISOString().slice(0, 10)}.csv`, mockClaims.map((claim) => ({
          claimId: claim.id,
          claimantName: claim.claimantName,
          type: claim.type,
          status: claim.status,
          region: claim.region,
          riskScore: claim.riskScore,
          submittedAt: claim.submittedAt
        })))
      }
    >
      Export CSV
    </button>
  </div>
);

export const LandingPage = () => (
  <div className="min-h-screen bg-mist">
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:py-16">
      <header className="text-center">
        <img src={primeLogo} alt="Prime Insurance" className="mx-auto h-12 w-auto" />
        <p className="eyebrow mt-6">Prime Life Insurance Rwanda</p>
        <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-navy-900 sm:text-5xl">Secure Tomorrow Today</h1>
        <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
          A digital claims verification and decision system — submit claims, upload evidence, and track outcomes. Staff
          verify documents, review AI insights, and record approved or rejected decisions. No payment processing.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link to="/login" className="btn-primary px-8">
            Sign in
          </Link>
          <Link to="/register" className="btn-gold px-8">
            Register as claimant
          </Link>
        </div>
        <p className="mt-4 text-xs text-slate-500">
          Staff accounts are created by an administrator.{" "}
          <Link to="/help" className="font-semibold text-prime-700 hover:text-prime-800">
            Questions? Open the help chat
          </Link>
        </p>
      </header>

      <section className="mt-14 grid gap-5 sm:grid-cols-3">
        <LandingFeature
          title="Submit a claim"
          description="Guided steps for auto, health, and property claims with document upload."
          to="/register"
          cta="Get started"
        />
        <LandingFeature
          title="Track your claim"
          description="See status updates, timelines, and requests for more information."
          to="/login"
          cta="Sign in to track"
        />
        <LandingFeature
          title="Need help?"
          description="Contact our team or read common questions about the claims process."
          to="/contact"
          cta="Contact us"
        />
      </section>

      <section className="card mt-10 p-6 sm:p-8">
        <h2 className="text-lg font-bold text-navy-900">What this system does</h2>
        <p className="mt-2 text-sm text-slate-600">
          Submit a claim → AI checks documents and risk → officers decide → you receive approval or rejection. AI supports
          staff; it does not make the final decision.
        </p>
        <ul className="mt-4 space-y-3 text-sm text-slate-700">
          <li className="flex gap-3">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-prime-600" />
            Digital claim submission, evidence upload, and real-time tracking.
          </li>
          <li className="flex gap-3">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-prime-600" />
            AI document verification and fraud risk scoring for investigators and officers.
          </li>
          <li className="flex gap-3">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-prime-600" />
            Notifications, reporting, and analytics — not financial transactions.
          </li>
        </ul>
        <p className="mt-6 text-sm font-semibold text-navy-900">+250 788 150 100 · Toll-free 1320</p>
        <p className="text-sm text-slate-500">KN 4 Ave, Kigali, Rwanda</p>
      </section>

      <footer className="mt-12 flex flex-wrap justify-center gap-6 border-t border-slate-200/80 pt-8 text-sm font-semibold text-slate-600">
        <Link to="/about" className="hover:text-prime-700">
          About
        </Link>
        <Link to="/help" className="hover:text-prime-700">
          Help
        </Link>
        <Link to="/contact" className="hover:text-prime-700">
          Contact
        </Link>
        <Link to="/login" className="hover:text-prime-700">
          Sign in
        </Link>
      </footer>
      <p className="mt-6 text-center text-xs text-slate-400">
        © {new Date().getFullYear()} Prime Life Insurance Rwanda
      </p>
    </div>
  </div>
);

const LandingFeature = ({
  title,
  description,
  to,
  cta
}: {
  title: string;
  description: string;
  to: string;
  cta: string;
}) => (
  <div className="card flex flex-col p-5">
    <h3 className="font-bold text-navy-900">{title}</h3>
    <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-600">{description}</p>
    <Link to={to} className="mt-4 inline-flex items-center text-sm font-semibold text-prime-700">
      {cta} <ArrowRight className="ml-1 h-4 w-4" />
    </Link>
  </div>
);

export const RegisterPage = () => {
  const navigate = useNavigate();
  const registerClaimant = useRegisterClaimant();
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    nationalIdOrPolicy: "",
    password: "",
    confirmPassword: ""
  });

  const passwordScore = [
    form.password.length >= 8,
    /[A-Z]/.test(form.password),
    /\d/.test(form.password),
    /[^A-Za-z0-9]/.test(form.password)
  ].filter(Boolean).length;
  const errors = {
    name: form.name.trim().length < 3 ? "Full name is required." : "",
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email) ? "" : "Enter a valid email address.",
    phone: form.phone.trim().length >= 8 ? "" : "Phone number is required.",
    nationalIdOrPolicy: form.nationalIdOrPolicy.trim().length >= 5 ? "" : "National ID or policy number is required.",
    password: passwordScore >= 4 ? "" : "Use 8+ chars with uppercase, number, and symbol.",
    confirmPassword: form.password === form.confirmPassword ? "" : "Passwords must match."
  };
  const isValid = Object.values(errors).every((error) => !error);

  const update = (field: keyof typeof form, value: string) => setForm((current) => ({ ...current, [field]: value }));

  const submitRegistration = (event: FormEvent) => {
    event.preventDefault();
    if (!isValid) {
      toast.error("Please complete the required fields.");
      return;
    }

    registerClaimant.mutate(
      {
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim(),
        nationalIdOrPolicy: form.nationalIdOrPolicy.trim(),
        password: form.password
      },
      {
        onSuccess: (data) => {
          toast.success(data.message ?? "Account created. Please sign in.");
          navigate("/login", { replace: true });
        },
        onError: (error) => toast.error(error instanceof Error ? error.message : "Registration failed.")
      }
    );
  };

  return (
    <AuthShell
      title="Create claimant account"
      description="Customer registration only. Officers, investigators, and admins are created by your administrator."
      footer={
        <p className="text-center text-sm text-slate-500">
          Already have an account?{" "}
          <Link to="/login" className="font-semibold text-prime-700 hover:text-prime-800">
            Sign in
          </Link>
        </p>
      }
    >
        <form onSubmit={submitRegistration}>
          <div className="grid gap-4 md:grid-cols-2">
            <FieldError value={errors.name}><input className="input" value={form.name} onChange={(event) => update("name", event.target.value)} placeholder="Full name" autoComplete="name" /></FieldError>
            <FieldError value={errors.email}><input className="input" type="email" value={form.email} onChange={(event) => update("email", event.target.value)} placeholder="Email address" autoComplete="email" /></FieldError>
            <FieldError value={errors.phone}><input className="input" value={form.phone} onChange={(event) => update("phone", event.target.value)} placeholder="Phone number" autoComplete="tel" /></FieldError>
            <FieldError value={errors.nationalIdOrPolicy}><input className="input" value={form.nationalIdOrPolicy} onChange={(event) => update("nationalIdOrPolicy", event.target.value)} placeholder="National ID / Policy Number" /></FieldError>
            <FieldError value={errors.password}><input className="input" type="password" value={form.password} onChange={(event) => update("password", event.target.value)} placeholder="Password" autoComplete="new-password" /></FieldError>
            <FieldError value={errors.confirmPassword}><input className="input" type="password" value={form.confirmPassword} onChange={(event) => update("confirmPassword", event.target.value)} placeholder="Confirm password" autoComplete="new-password" /></FieldError>
          </div>
          <div className="mt-4 h-2 rounded-full bg-slate-100">
            <div className={`h-2 rounded-full ${passwordScore >= 4 ? "bg-success-500" : "bg-amber-500"}`} style={{ width: `${Math.max(12, passwordScore * 25)}%` }} />
          </div>
          <p className="mt-2 text-xs text-slate-500">Password strength: {passwordScore >= 4 ? "Strong enough" : "Needs improvement"}</p>
          <button
            type="submit"
            className="btn-primary mt-6 w-full"
            disabled={!isValid || registerClaimant.isPending}
          >
            {registerClaimant.isPending ? "Creating account..." : "Register"}
          </button>
        </form>
    </AuthShell>
  );
};

export const ForgotPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [step, setStep] = useState<"email" | "sent" | "reset" | "done">(
    searchParams.get("reset") === "true" || searchParams.get("token") ? "reset" : "email"
  );
  const [email, setEmail] = useState(searchParams.get("email") ?? "");
  const [resetToken, setResetToken] = useState(searchParams.get("token") ?? "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [deliveryMessage, setDeliveryMessage] = useState("");
  const [deliveryStatus, setDeliveryStatus] = useState<"idle" | "success" | "warning" | "error">("idle");
  const [devCode, setDevCode] = useState<string | null>(null);
  const [smtpError, setSmtpError] = useState<string | null>(null);
  const passwordScore = [password.length >= 8, /[A-Z]/.test(password), /\d/.test(password), /[^A-Za-z0-9]/.test(password)].filter(Boolean).length;
  const normalizedEmail = email.trim().toLowerCase();
  const emailIsValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail);
  const resetCode = resetToken.trim();
  const resetCodeValid = /^\d{6}$/.test(resetCode) || resetCode.length >= 16;
  const canReset = emailIsValid && resetCodeValid && passwordScore >= 4 && password === confirmPassword;

  const sendResetLink = async () => {
    if (!emailIsValid) {
      toast.error("Enter a valid email address.");
      return;
    }

    setIsSending(true);
    setDeliveryMessage("");
    setDeliveryStatus("idle");
    setDevCode(null);
    setSmtpError(null);
    try {
      const result = await backendService.requestPasswordReset(normalizedEmail);
      setDeliveryMessage(result.message);
      setSmtpError(result.smtpError ?? null);
      if (result.devCode) {
        setDevCode(result.devCode);
        setResetToken(result.devCode);
      }
      const emailed = result.emailSent !== false;
      setDeliveryStatus(emailed ? "success" : "warning");
      toast.success(
        emailed ? result.message : "Email could not be sent — use the code shown below."
      );
      setStep("sent");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to send reset link.";
      setDeliveryMessage(message);
      setDeliveryStatus("error");
      toast.error(message);
    } finally {
      setIsSending(false);
    }
  };

  const handleEmailSubmit = (event: FormEvent) => {
    event.preventDefault();
    void sendResetLink();
  };

  const handleResetSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!emailIsValid) {
      toast.error("The reset link is missing a valid email address.");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords must match.");
      return;
    }
    if (!canReset) {
      toast.error("Use 8+ characters with uppercase, number, and symbol.");
      return;
    }

    setIsResetting(true);
    try {
      await backendService.resetPassword({ email: normalizedEmail, code: resetToken.trim(), password });
      toast.success("Password reset successful. Please login with your new password.");
      setStep("done");
      window.setTimeout(() => navigate("/login"), 1800);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Password reset failed.");
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <AuthShell title={step === "reset" ? "Create new password" : "Forgot password"} description={step === "reset" ? "Use the 6-digit code or secure link from your email." : "Enter your account email. We will send a reset link and a 6-digit code."}>
      {step === "email" ? (
        <form onSubmit={handleEmailSubmit} className="space-y-4">
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">Account email</span>
            <input className="input" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="name@example.com" autoComplete="email" required />
          </label>
          {deliveryMessage ? (
            <div
              className={`rounded-2xl border p-4 text-sm leading-6 ${
                deliveryStatus === "success"
                  ? "border-success-100 bg-success-50 text-success-700"
                  : deliveryStatus === "warning"
                    ? "border-amber-100 bg-amber-50 text-amber-900"
                    : "border-rose-100 bg-rose-50 text-rose-700"
              }`}
            >
              {deliveryMessage}
              {devCode ? (
                <p className="mt-3 text-center font-mono text-2xl font-bold tracking-[0.35em] text-prime-700">{devCode}</p>
              ) : null}
              {smtpError ? <p className="mt-2 text-xs opacity-80">{smtpError}</p> : null}
            </div>
          ) : null}
          <button
            type="submit"
            className="btn-primary w-full"
            disabled={isSending}
          >
            {isSending ? "Sending..." : "Send"}
          </button>
          <Link to="/login" className="btn-secondary w-full">Back to login</Link>
        </form>
      ) : null}
      {step === "sent" ? (
        <div className="text-center">
          <MailCheck className="mx-auto h-12 w-12 text-prime-600" />
          <div
            className={`mt-5 rounded-2xl border p-4 text-sm leading-6 ${
              deliveryStatus === "warning"
                ? "border-amber-100 bg-amber-50 text-amber-900"
                : "border-success-100 bg-success-50 text-success-700"
            }`}
          >
            {deliveryMessage || `Reset instructions sent to ${email}. Check your inbox for a link and a 6-digit code.`}
            {devCode ? (
              <p className="mt-3 font-mono text-2xl font-bold tracking-[0.35em] text-prime-700">{devCode}</p>
            ) : null}
            {smtpError ? <p className="mt-2 text-xs opacity-80">{smtpError}</p> : null}
          </div>
          <button
            type="button"
            className="btn-primary mt-6 w-full"
            onClick={() => {
              if (devCode) {
                setResetToken(devCode);
              }
              setStep("reset");
            }}
          >
            Enter reset code
          </button>
          <button
            type="button"
            className="btn-secondary mt-3 w-full"
            disabled={isSending}
            onClick={() => void sendResetLink()}
          >
            {isSending ? "Sending..." : "Resend email"}
          </button>
          <Link to="/login" className="btn-secondary mt-3 w-full">Back to login</Link>
        </div>
      ) : null}
      {step === "reset" ? (
        <form className="space-y-4" onSubmit={handleResetSubmit}>
          <p className="rounded-2xl border border-prime-100 bg-prime-50 p-4 text-sm leading-6 text-slate-600">
            Account: <span className="font-semibold text-slate-900">{email || "your account"}</span>
          </p>
          {!emailIsValid ? (
            <input className="input" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Account email" autoComplete="email" required />
          ) : null}
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">6-digit code or link token</span>
            <input
              className="input"
              value={resetToken}
              onChange={(event) => setResetToken(event.target.value)}
              placeholder="123456 or paste token from email link"
              autoComplete="one-time-code"
              required
            />
          </label>
          <input className="input" type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="New password" autoComplete="new-password" required />
          <input className="input" type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="Confirm new password" autoComplete="new-password" required />
          <div className="h-2 rounded-full bg-slate-100">
            <div className={`h-2 rounded-full ${passwordScore >= 4 ? "bg-success-500" : "bg-amber-500"}`} style={{ width: `${Math.max(12, passwordScore * 25)}%` }} />
          </div>
          <div className="grid gap-2 text-xs text-slate-500 sm:grid-cols-2">
            <span className={password.length >= 8 ? "font-semibold text-success-600" : ""}>8+ characters</span>
            <span className={/[A-Z]/.test(password) ? "font-semibold text-success-600" : ""}>Uppercase letter</span>
            <span className={/\d/.test(password) ? "font-semibold text-success-600" : ""}>Number</span>
            <span className={/[^A-Za-z0-9]/.test(password) ? "font-semibold text-success-600" : ""}>Symbol</span>
          </div>
          <button
            type="submit"
            className="btn-primary w-full"
            disabled={!canReset || isResetting}
          >
            {isResetting ? "Saving new password..." : "Create new password"}
          </button>
          <button
            type="button"
            className="btn-secondary w-full"
            disabled={isSending}
            onClick={() => void sendResetLink()}
          >
            {isSending ? "Sending..." : "Send a new reset link"}
          </button>
        </form>
      ) : null}
      {step === "done" ? (
        <div className="text-center">
          <div className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-full bg-success-100 text-success-700">
            <CheckCircle2 className="h-7 w-7" />
          </div>
          <p className="mb-6 text-sm leading-6 text-slate-600">Your password has been changed. You can now sign in with the new password.</p>
          <Link to="/login" className="btn-primary w-full">Return to login</Link>
        </div>
      ) : null}
    </AuthShell>
  );
};

export const OtpVerificationPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const email = searchParams.get("email") ?? "";
  const initialDevCode = searchParams.get("devCode") ?? "";
  const [code, setCode] = useState(initialDevCode.replace(/\D/g, "").slice(0, 6));
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const verifyOtp = async () => {
    if (!email) {
      toast.error("Missing email. Register again or open the link from your inbox.");
      return;
    }
    if (code.trim().length !== 6) {
      toast.error("Enter the full 6-digit code.");
      return;
    }
    setIsVerifying(true);
    try {
      const result = await backendService.verifyOtp(email, code.trim(), "registration");
      toast.success(result.message);
      navigate("/login");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Verification failed.");
    } finally {
      setIsVerifying(false);
    }
  };

  const resendCode = async () => {
    if (!email) {
      toast.error("Missing email address.");
      return;
    }
    setIsResending(true);
    try {
      const result = await backendService.sendOtp(email, "registration");
      if (result.devCode) {
        setCode(result.devCode);
      }
      toast.success(result.message);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not resend code.");
    } finally {
      setIsResending(false);
    }
  };

  return (
    <AuthShell
      title="Verify email"
      description={email ? `Code sent to ${email}` : "Enter the code from your email"}
    >
      {initialDevCode ? (
        <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-center">
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-800">Verification code</p>
          <p className="mt-2 font-mono text-2xl font-bold tracking-[0.35em] text-amber-950">{initialDevCode}</p>
        </div>
      ) : null}
      <input
        className="input text-center text-lg font-bold tracking-[0.35em]"
        value={code}
        onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
        placeholder="000000"
        inputMode="numeric"
        maxLength={6}
      />
      <button type="button" className="btn-primary mt-6 w-full" disabled={isVerifying} onClick={() => void verifyOtp()}>
        {isVerifying ? "Verifying..." : "Verify email"}
      </button>
      <button type="button" className="btn-secondary mt-3 w-full" disabled={isResending} onClick={() => void resendCode()}>
        {isResending ? "Sending..." : "Resend code"}
      </button>
      <Link to="/login" className="btn-secondary mt-3 block w-full text-center">
        Back to login
      </Link>
    </AuthShell>
  );
};

const AuthShell = ({
  title,
  description,
  children,
  footer
}: {
  title: string;
  description: string;
  children: ReactNode;
  footer?: ReactNode;
}) => (
  <AuthLayout title={title} description={description} wide footer={footer}>
    {children}
  </AuthLayout>
);

export const SaveDraftPage = () => {
  const { data: claims = [] } = useClaims();
  const drafts = claims.filter((c) => c.status === "Draft");
  return (
    <GenericPage
      eyebrow="Claim Drafts"
      title="Resume saved submissions"
      description="Draft claims from the database. Open a draft to continue editing or submit."
      metrics={[
        ["Saved drafts", String(drafts.length), "In PostgreSQL"],
        ["All claims", String(claims.length), "Total records"],
        ["Submitted", String(claims.filter((c) => c.status !== "Draft").length), "Active pipeline"]
      ]}
    >
      <ClaimsTable claims={drafts.length ? drafts : claims} />
    </GenericPage>
  );
};

const claimTypeLabel = (type: string) =>
  ({ auto: "Auto / motor", health: "Health", property: "Property" })[type] ?? type;

function reviewWindowDays(submittedAt: string, estimatedCompletion: string) {
  const start = new Date(submittedAt).getTime();
  const end = new Date(estimatedCompletion).getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) {
    return 10;
  }
  return Math.max(1, Math.ceil((end - start) / (24 * 60 * 60 * 1000)));
}

export const ClaimConfirmationPage = () => {
  const latestReference = useClaimsStore((state) => state.latestReference);
  const reference = latestReference ?? "";
  const { data: claim, isLoading } = useClaim(reference);
  const { user } = useAuth();

  const copyReference = async () => {
    if (!reference) {
      toast.error("No reference number to copy.");
      return;
    }
    try {
      await navigator.clipboard.writeText(reference);
      toast.success("Reference copied to clipboard.");
    } catch {
      toast.error("Could not copy — select and copy the number manually.");
    }
  };

  const reviewDays = claim ? reviewWindowDays(claim.submittedAt, claim.estimatedCompletion) : null;

  return (
    <GenericPage
      eyebrow="Submission Success"
      title="Claim confirmation and reference"
      description="Your claim is in the system. Save your reference number and follow the steps below while we verify and route your file."
    >
      <SectionCard title="Reference number generated" description="Share this number with the claimant for quick follow-up.">
        <div className="rounded-3xl bg-gradient-to-br from-prime-50 to-white p-6 ring-1 ring-prime-100">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-slate-600">Submission reference</p>
              <p className="mt-2 font-mono text-4xl font-bold tracking-tight text-prime-700">
                {reference || (isLoading ? "Loading…" : "—")}
              </p>
            </div>
            {reference ? (
              <button type="button" className="btn-secondary shrink-0" onClick={() => void copyReference()}>
                Copy reference
              </button>
            ) : null}
          </div>
          <p className="mt-4 text-sm leading-relaxed text-slate-600">
            Your claim is in the pipeline: AI document check → fraud risk score → officer review. You will be notified if
            more information is needed or when a final decision is recorded (no payment on this portal).
          </p>
          {claim ? (
            <p className="mt-2 text-xs text-slate-500">
              Submitted {formatDate(claim.submittedAt)} · Current status:{" "}
              <span className="font-semibold text-slate-700">{claim.status}</span>
            </p>
          ) : null}
        </div>
      </SectionCard>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <SectionCard title="Submission summary" description="Snapshot of what was filed.">
          {isLoading && reference ? (
            <p className="text-sm text-slate-500">Loading claim details…</p>
          ) : claim ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <InfoBlock title="Claimant" value={claim.claimantName} />
              <InfoBlock title="Policy number" value={claim.policyNumber} />
              <InfoBlock title="Line of business" value={claimTypeLabel(claim.type)} />
              <InfoBlock title="Region" value={claim.region} />
              <InfoBlock title="Assigned team" value={claim.assignedTeam} />
              <InfoBlock title="Documents uploaded" value={String(claim.documents.length)} />
              <div className="sm:col-span-2">
                <InfoBlock title="AI intake summary" value={claim.status} detail={claim.aiSummary} />
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-500">
              {reference
                ? "Summary details are not available yet. Use your reference on the dashboard to track progress."
                : "Submit a claim first to see a confirmation summary here."}
            </p>
          )}
        </SectionCard>

        <SectionCard title="Expected review window" description="Typical handling time for this intake path.">
          <div className="rounded-3xl border border-slate-200 bg-white p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-prime-100 text-prime-700">
                <Clock3 className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Estimated completion</p>
                <p className="text-xl font-bold text-slate-900">
                  {claim ? formatDate(claim.estimatedCompletion) : "Within 7–14 business days"}
                </p>
              </div>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-slate-600">
              {reviewDays != null
                ? `Most claims like yours are reviewed within about ${reviewDays} day${reviewDays === 1 ? "" : "s"}. Complex cases or missing documents may extend this window.`
                : "After documents pass AI checks, an officer validates details and routes the claim to the right team."}
            </p>
            {claim ? (
              <p className="mt-3 text-xs text-slate-500">
                Risk score {claim.riskScore} · Officer queue: {claim.assignedOfficer || "Assigning…"}
              </p>
            ) : null}
          </div>
        </SectionCard>
      </div>

      <div className="mt-6">
      <SectionCard
        title="Next actions for the claimant"
        description="What to do while your claim is being processed."
      >
        <div className="grid gap-3 sm:grid-cols-2">
          {reference ? (
            <Link
              to={`/claims/${reference}`}
              className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-5 py-4 transition hover:border-prime-200 hover:bg-prime-50/40"
            >
              <span className="font-semibold text-slate-900">Track this claim</span>
              <ArrowRight className="h-5 w-5 text-prime-600" />
            </Link>
          ) : null}
          <Link
            to="/notifications"
            className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-5 py-4 transition hover:border-prime-200 hover:bg-prime-50/40"
          >
            <span className="font-semibold text-slate-900">View notifications</span>
            <ArrowRight className="h-5 w-5 text-prime-600" />
          </Link>
          {reference ? (
            <Link
              to={`/evidence/upload?claimId=${encodeURIComponent(reference)}`}
              className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-5 py-4 transition hover:border-prime-200 hover:bg-prime-50/40"
            >
              <span className="font-semibold text-slate-900">Upload more evidence</span>
              <ArrowRight className="h-5 w-5 text-prime-600" />
            </Link>
          ) : null}
          <Link
            to="/dashboard"
            className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-5 py-4 transition hover:border-prime-200 hover:bg-prime-50/40"
          >
            <span className="font-semibold text-slate-900">
              {user?.role === "claimant" ? "Return to my dashboard" : "Return to dashboard"}
            </span>
            <ArrowRight className="h-5 w-5 text-prime-600" />
          </Link>
        </div>
        {!reference ? (
          <Link to="/claims/new" className="btn-primary mt-5 inline-flex">
            Submit a new claim
          </Link>
        ) : null}
      </SectionCard>
      </div>
    </GenericPage>
  );
};

export const PolicyLookupPage = () => {
  const { data: claims = [] } = useClaims();
  const [query, setQuery] = useState("");
  const match = claims.find((c) => c.policyNumber.toLowerCase().includes(query.trim().toLowerCase())) ?? claims[0];
  return (
    <GenericPage eyebrow="Policy Lookup" title="Search policy and linked claims" description="Search by policy number to find existing claims and claimant details.">
      <SectionCard title="Lookup panel">
        <input className="input max-w-md" placeholder="Policy number e.g. AUTO-44390" value={query} onChange={(e) => setQuery(e.target.value)} />
        {match ? (
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <InfoBlock title="Policy number" value={match.policyNumber} />
            <InfoBlock title="Insured party" value={match.claimantName} />
            <InfoBlock title="Latest claim" value={`${match.id} · ${match.status}`} />
          </div>
        ) : (
          <p className="mt-4 text-sm text-slate-500">No matching policy in current claims data.</p>
        )}
        <Link to="/claims/new" className="btn-primary mt-6 inline-flex">
          Start new claim for this policy
        </Link>
      </SectionCard>
    </GenericPage>
  );
};

export const PendingDocumentsPage = () => {
  const { data: claims = [] } = useClaims();
  const pending = claims.filter((c) => c.status === "Pending" || c.documents.some((d) => d.aiStatus !== "Valid"));
  return (
    <GenericPage eyebrow="Verification Queue" title="Pending documents queue" description="Claims with pending status or non-valid documents.">
      <SectionCard title="Queue overview">
        <div className="space-y-3">
          {pending.map((claim) => (
            <Link key={claim.id} to={`/claims/${claim.id}`} className="block rounded-2xl transition hover:bg-slate-50">
              <QueueRow title={claim.id} subtitle={`${claim.claimantName} · ${claim.documents.length} docs`} tag="Review" />
            </Link>
          ))}
        </div>
        <Link to="/verification" className="btn-primary mt-6 inline-flex">
          Open verification workspace
        </Link>
      </SectionCard>
    </GenericPage>
  );
};

export const ManualApprovalPage = () => {
  const { data: claims = [] } = useClaims();
  const [selected, setSelected] = useState(claims[0] ?? null);
  const active = selected ?? claims[0];
  return (
    <GenericPage eyebrow="Officer Override" title="Manual approval and validation override" description="Select a claim and apply officer decisions with full audit trail.">
      <div className="grid gap-6 xl:grid-cols-2">
        <ClaimQueueList claims={claims} selectedId={active?.id} onSelect={setSelected} />
        <SectionCard title="Override controls">
          <ClaimActionButtons claim={active} showInvestigate />
        </SectionCard>
      </div>
    </GenericPage>
  );
};

export const EvidenceUploadPage = () => {
  const { data: claims = [] } = useClaims();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const uploadEvidence = useUploadEvidence();
  const paramClaimId = searchParams.get("claimId") ?? "";
  const visibleClaims = claims;
  const [claimId, setClaimId] = useState(paramClaimId || visibleClaims[0]?.id || "");
  const [files, setFiles] = useState<File[]>([]);

  const selectedClaim = visibleClaims.find((claim) => claim.id === claimId) ?? visibleClaims[0];
  const activeClaimId = selectedClaim?.id ?? "";
  const classifiedFiles = useMemo(
    () =>
      files.map((file) => ({
        file,
        result: classifyUpload(file.name, file.type.includes("pdf") || file.name.toLowerCase().endsWith(".pdf") ? "pdf" : "image")
      })),
    [files]
  );

  const handleFiles = (event: ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(event.target.files ?? []);
    if (picked.length) {
      setFiles((current) => [...current, ...picked]);
    }
    event.target.value = "";
  };

  const imagePreviews = useMemo(
    () =>
      files
        .filter((f) => f.type.startsWith("image/"))
        .map((file) => ({ file, url: URL.createObjectURL(file) })),
    [files]
  );

  return (
    <GenericPage
      eyebrow="Evidence Upload"
      title={user?.role === "claimant" ? "Upload photos and documents" : "Evidence intake"}
      description={
        user?.role === "claimant"
          ? "Add as many photos as you need. Every upload is stored on the claim and visible to you and the officer."
          : "Attach photos, PDFs, and documents to a claim record."
      }
    >
      <SectionCard
        title="Upload more evidence"
        description="Choose a claim, add photos (you can upload multiple times). All files stay on the claim gallery."
        action={user?.role !== "claimant" ? <Link to="/evidence/gallery" className="btn-secondary">Open gallery</Link> : undefined}
      >
        {visibleClaims.length === 0 ? (
          <p className="text-sm text-slate-500">No claims available. Submit a claim first.</p>
        ) : (
        <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-4">
            <select className="input" value={activeClaimId} onChange={(event) => setClaimId(event.target.value)}>
              {visibleClaims.map((claim) => (
                <option key={claim.id} value={claim.id}>
                  {claim.id} - {claim.claimantName} ({claim.status})
                </option>
              ))}
            </select>
            {selectedClaim ? (
              <p className="text-sm text-slate-600">{selectedClaim.aiSummary}</p>
            ) : null}
            <label className="grid min-h-52 cursor-pointer place-items-center rounded-3xl border border-dashed border-prime-300 bg-prime-50/60 p-6 text-center transition hover:bg-prime-50">
              <input
                className="sr-only"
                type="file"
                multiple
                accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.webp,.mp4,.mov,.webm"
                onChange={handleFiles}
              />
              <span>
                <span className="block text-base font-semibold text-slate-900">Add photos or PDFs</span>
                <span className="mt-2 block text-sm text-slate-500">Select multiple files; you can add more after each upload.</span>
              </span>
            </label>
            {files.length > 0 ? (
              <p className="text-sm font-medium text-slate-700">{files.length} file(s) ready to upload</p>
            ) : null}
            <button
              type="button"
              className="btn-primary w-full"
              disabled={!activeClaimId || files.length === 0 || uploadEvidence.isPending}
              onClick={() => {
                uploadEvidence.mutate(
                  { claimId: activeClaimId, files },
                  {
                    onSuccess: () => {
                      toast.success("Photos saved on your claim. You can add more anytime.");
                      setFiles([]);
                    },
                    onError: () => toast.error("Evidence upload failed. Please choose a claim and try again.")
                  }
                );
              }}
            >
              {uploadEvidence.isPending ? "Uploading..." : "Upload & save on claim"}
            </button>
            {selectedClaim && selectedClaim.documents.length > 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                <ClaimEvidenceGallery
                  claimId={selectedClaim.id}
                  claimType={selectedClaim.type}
                  documents={selectedClaim.documents}
                  title="Already on this claim"
                  emptyMessage=""
                  showPdfList
                  manageable={user?.role === "claimant"}
                />
              </div>
            ) : null}
          </div>
          <div className="space-y-3">
            {classifiedFiles.length ? (
              classifiedFiles.map(({ file, result }) => (
                <div key={`${file.name}-${file.size}`} className="rounded-2xl border border-slate-200 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-900">{file.name}</p>
                      <p className="mt-1 text-sm text-slate-500">{Math.max(1, Math.round(file.size / 1024))} KB</p>
                    </div>
                    <span className="rounded-full bg-prime-50 px-3 py-1 text-xs font-semibold text-prime-700">
                      {result.aiStatus}
                    </span>
                  </div>
                  <p className="mt-3 text-sm text-slate-600">{result.documentType} - {result.confidenceScore}% confidence</p>
                  <p className="mt-1 text-xs text-slate-500">{result.reviewNote}</p>
                </div>
              ))
            ) : (
              <PreviewBox label="Selected evidence and AI classification will appear here" />
            )}
            {imagePreviews.length > 0 ? (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {imagePreviews.map(({ file, url }) => (
                  <div key={url} className="overflow-hidden rounded-xl border border-slate-200">
                    <img src={url} alt={file.name} className="h-28 w-full object-cover" />
                    <p className="truncate px-2 py-1 text-xs text-slate-600">{file.name}</p>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </div>
        )}
      </SectionCard>
    </GenericPage>
  );
};

export const EvidenceGalleryPage = () => {
  const { data: claims = [] } = useClaims();
  const { user } = useAuth();
  const [filter, setFilter] = useState<"all" | "image" | "video" | "pdf" | "document">("all");
  const [exporting, setExporting] = useState(false);

  const items = claims.flatMap((claim) =>
    claim.documents.map((doc) => ({ claimId: claim.id, claimType: claim.type, claimant: claim.claimantName, ...doc }))
  );

  const filtered = items.filter((item) => {
    if (filter === "all") {
      return true;
    }
    return item.kind === filter;
  });

  const counts = {
    all: items.length,
    image: items.filter((i) => i.kind === "image").length,
    video: items.filter((i) => i.kind === "video").length,
    pdf: items.filter((i) => i.kind === "pdf").length,
    document: items.filter((i) => i.kind === "document").length
  };

  const exportEvidencePdf = async () => {
    setExporting(true);
    try {
      const { generateEvidenceInventoryPdf } = await import("@/utils/pdfReport");
      await generateEvidenceInventoryPdf(claims, {
        title: user?.role === "claimant" ? "My evidence inventory" : "Evidence inventory report",
        generatedBy: user?.name ?? "System user",
        generatedByRole: user?.role,
        generatedAt: new Date()
      });
      toast.success("Evidence PDF downloaded.");
    } catch {
      toast.error("Could not export PDF.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <GenericPage
      eyebrow="Evidence Gallery"
      title={user?.role === "claimant" ? "My evidence gallery" : "Evidence gallery and folder management"}
      description={
        user?.role === "claimant"
          ? "Your uploaded photos, videos, and documents across your claims."
          : "All photos, videos, PDFs, and documents across claims with AI status tags."
      }
    >
      <SectionCard
        title={user?.role === "claimant" ? "My uploads" : "Gallery"}
        action={
          <div className="flex flex-wrap gap-2">
            <button type="button" className="btn-secondary" disabled={exporting} onClick={exportEvidencePdf}>
              {exporting ? "Exporting…" : "Export evidence PDF"}
            </button>
            <Link to="/evidence/upload" className="btn-primary">
              Upload evidence
            </Link>
          </div>
        }
      >
        <div className="mb-4 flex flex-wrap gap-2">
          {(
            [
              ["all", "All"],
              ["image", "Photos"],
              ["video", "Videos"],
              ["pdf", "PDFs"],
              ["document", "Other"]
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              className={filter === key ? "btn-primary" : "btn-secondary"}
              onClick={() => setFilter(key)}
            >
              {label} ({counts[key]})
            </button>
          ))}
        </div>
        {filtered.length === 0 ? (
          <p className="text-sm text-slate-500">No evidence in this category yet.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {filtered.map((item) =>
              user?.role === "claimant" ? (
                <EvidenceManageCard
                  key={`${item.claimId}-${item.id}`}
                  claimId={item.claimId}
                  claimType={item.claimType}
                  document={item}
                />
              ) : (
                <EvidenceThumbnail
                  key={`${item.claimId}-${item.id}`}
                  claimId={item.claimId}
                  claimType={item.claimType}
                  document={item}
                />
              )
            )}
          </div>
        )}
      </SectionCard>
    </GenericPage>
  );
};

export const WitnessStatementPage = () => (
  <GenericPage eyebrow="Witness Evidence" title="Witness statement upload" description="Capture witness statements with attribution, timestamps, and storage security indicators.">
    <SectionCard title="Statement capture form">
      <div className="grid gap-4 md:grid-cols-2">
        <input className="input" placeholder="Witness name" />
        <input className="input" placeholder="Phone number" />
        <textarea className="input min-h-36 md:col-span-2" placeholder="Recorded statement summary" />
      </div>
    </SectionCard>
  </GenericPage>
);

export const SecureFilePreviewPage = () => (
  <GenericPage eyebrow="Secure Preview" title="Preview evidence with chain of custody" description="Show watermarking, metadata, preview controls, and secure access indicators.">
    <SectionCard title="Secure storage visualization">
      <div className="grid gap-4 md:grid-cols-2">
        <PreviewBox label="Watermarked file preview" />
        <div className="space-y-3">
          <InfoBlock title="Checksum" value="A91K-22P0" />
          <InfoBlock title="Storage class" value="Encrypted archive" />
          <InfoBlock title="Custody log" value="7 access events recorded" />
        </div>
      </div>
    </SectionCard>
  </GenericPage>
);

export const ClaimStatusTimelinePage = () => {
  const { data: claims = [] } = useClaims();
  const [claimId, setClaimId] = useState(claims[0]?.id ?? "");
  const claim = claims.find((c) => c.id === claimId) ?? claims[0];

  return (
    <GenericPage eyebrow="Status Timeline" title="Claim status timeline" description="Live milestone timeline from the claim record.">
      <SectionCard title="Milestone timeline">
        <select className="input mb-4 max-w-xl" value={claim?.id ?? ""} onChange={(e) => setClaimId(e.target.value)}>
          {claims.map((c) => (
            <option key={c.id} value={c.id}>{c.id} - {c.status}</option>
          ))}
        </select>
        <div className="space-y-4">
          {(claim?.timeline ?? []).map((entry) => (
            <QueueRow key={entry.id} title={entry.label} subtitle={`${entry.actor} · ${formatDate(entry.at)}`} tag={claim?.status ?? ""} />
          ))}
        </div>
      </SectionCard>
    </GenericPage>
  );
};

export const ClientPortalPage = () => {
  const { data: claims = [] } = useClaims();
  const { data: notifications = [] } = useNotifications();
  const { user } = useAuth();
  const mine =
    user?.role === "claimant"
      ? claims.filter((c) => c.claimantName.trim().toLowerCase() === (user.name ?? "").trim().toLowerCase())
      : claims;
  const open = mine.filter((c) => c.status !== "Approved" && c.status !== "Rejected").length;
  const actionNeeded = notifications.filter((n) => n.status === "Action Needed").length;

  return (
    <GenericPage eyebrow="Self-Service Portal" title="Client self-service dashboard" description="Your claims and notifications from live data.">
      <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <SectionCard title="Portal widgets">
          <div className="space-y-3">
            <InfoBlock title="Open claims" value={String(open)} />
            <InfoBlock title="Action needed" value={String(actionNeeded)} />
            <InfoBlock title="Total claims" value={String(mine.length)} />
          </div>
          <Link to="/claims/new" className="btn-primary mt-4 inline-flex">Submit new claim</Link>
        </SectionCard>
        <SectionCard title="Recent activity">
          {notifications.slice(0, 8).map((item) => (
            <QueueRow key={item.id} title={item.title} subtitle={item.body} tag={item.status} />
          ))}
        </SectionCard>
      </div>
    </GenericPage>
  );
};

export const DecisionApprovalPage = () => {
  const { data: claims = [] } = useClaims();
  const [claimId, setClaimId] = useState("");
  const selectedClaim = claims.find((claim) => claim.id === claimId) ?? claims[0];

  return (
    <GenericPage eyebrow="Decision Approval" title="Multi-level decision approval" description="Review a claim, apply a decision, or open the full evaluation workspace.">
      <SectionCard title="Digital signature and approval" action={selectedClaim ? <Link to={`/claims/${selectedClaim.id}`} className="btn-secondary">Open workspace</Link> : null}>
        <div className="space-y-4">
          <select className="input max-w-xl" value={selectedClaim?.id ?? ""} onChange={(event) => setClaimId(event.target.value)}>
            {claims.map((claim) => (
              <option key={claim.id} value={claim.id}>
                {claim.id} - {claim.claimantName} - {claim.status}
              </option>
            ))}
          </select>
          {selectedClaim ? (
            <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
              {selectedClaim.aiSummary}
            </div>
          ) : null}
          <ClaimActionButtons claim={selectedClaim} />
        </div>
      </SectionCard>
    </GenericPage>
  );
};

export const EscalationManagementPage = () => {
  const { data: claims = [] } = useClaims();
  const escalated = claims.filter((c) => c.riskScore > 20 || c.status === "Investigation");
  return (
    <GenericPage eyebrow="Escalations" title="Escalation workflow management" description="High-risk and investigation claims from live data.">
      <SectionCard title="Escalation queue">
        <div className="space-y-3">
          {escalated.map((claim) => (
            <Link key={claim.id} to={`/claims/${claim.id}`} className="block rounded-2xl transition hover:bg-slate-50">
              <QueueRow title={claim.id} subtitle={claim.aiSummary} tag={`Risk ${claim.riskScore}`} />
            </Link>
          ))}
        </div>
      </SectionCard>
    </GenericPage>
  );
};

export const InternalNotesPage = () => {
  const { data: claims = [] } = useClaims();
  const addNote = useAddClaimNote();
  const { user } = useAuth();
  const [note, setNote] = useState("");
  const [claimId, setClaimId] = useState(claims[0]?.id ?? "");
  const selected = claims.find((c) => c.id === claimId);

  return (
    <GenericPage eyebrow="Internal Collaboration" title="Notes and communication thread" description="Notes are saved to the claim timeline in the database.">
      <SectionCard title="Internal thread" action={<Link to="/notifications" className="btn-secondary">Open communications</Link>}>
        <select className="input max-w-xl" value={claimId} onChange={(e) => setClaimId(e.target.value)}>
          {claims.map((c) => (
            <option key={c.id} value={c.id}>
              {c.id} - {c.claimantName}
            </option>
          ))}
        </select>
        {selected?.timeline.filter((t) => t.label.startsWith("Internal note")).map((t) => (
          <QueueRow key={t.id} title={t.actor} subtitle={t.label.replace("Internal note: ", "")} tag={formatDate(t.at)} />
        ))}
        <textarea
          className="input min-h-40"
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="Add decision notes, escalation details, or reviewer comments..."
        />
        <button
          type="button"
          className="btn-primary"
          disabled={!claimId || !note.trim() || addNote.isPending}
          onClick={() => {
            addNote.mutate(
              { claimId, note: note.trim(), actor: user?.name ?? "Officer" },
              {
                onSuccess: () => {
                  toast.success("Internal note saved to claim timeline.");
                  setNote("");
                },
                onError: () => toast.error("Could not save note.")
              }
            );
          }}
        >
          Save note
        </button>
      </SectionCard>
    </GenericPage>
  );
};

export const ExecutiveDashboardPage = () => {
  const { data: claims = [] } = useClaims();
  const sourceClaims = claims.length > 0 ? claims : mockClaims;

  const statusBreakdown = useMemo(() => {
    const map = new Map<string, number>();
    sourceClaims.forEach((claim) => {
      map.set(claim.status, (map.get(claim.status) ?? 0) + 1);
    });
    return Array.from(map.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [sourceClaims]);

  const trendData = useMemo(() => {
    const byMonth = new Map<string, { label: string; claims: number; approved: number; rejected: number }>();
    sourceClaims.forEach((claim) => {
      const date = new Date(claim.submittedAt);
      if (Number.isNaN(date.getTime())) return;
      const key = `${date.getFullYear()}-${date.getMonth()}`;
      const label = date.toLocaleDateString(undefined, { month: "short" });
      const current = byMonth.get(key) ?? { label, claims: 0, approved: 0, rejected: 0 };
      current.claims += 1;
      if (claim.status === "Approved") current.approved += 1;
      if (claim.status === "Rejected") current.rejected += 1;
      byMonth.set(key, current);
    });

    return Array.from(byMonth.entries())
      .sort(([a], [b]) => (a < b ? -1 : 1))
      .slice(-6)
      .map(([, value]) => value);
  }, [sourceClaims]);

  const approvedCount = sourceClaims.filter((claim) => claim.status === "Approved").length;
  const approvalRate = sourceClaims.length ? Math.round((approvedCount / sourceClaims.length) * 100) : 0;
  const fraudFlags = sourceClaims.filter((claim) => claim.riskScore >= 25).length;

  const pieColors = ["#2563eb", "#16a34a", "#f59e0b", "#ef4444", "#7c3aed", "#64748b"];

  return (
    <GenericPage
      eyebrow="Analytics"
      title="Claims operations overview"
      description="Volume, decisions, AI-assisted review quality, and fraud signals — operational metrics only (no payments)."
      metrics={[
        ["Claims volume", String(sourceClaims.length), "Current dataset"],
        ["Approval rate", `${approvalRate}%`, "Officer decisions"],
        ["AI routing accuracy", "92%", "Validated by supervisors"],
        ["Fraud flags", String(fraudFlags), "Open investigations"]
      ]}
    >
      <SectionCard title="Leadership action areas" description="Quick links to trend analysis, performance, and compliance readiness.">
        <div className="grid gap-4 md:grid-cols-3">
          <InfoBlock title="Trend alert" value="Health claims rising in Kigali" />
          <InfoBlock title="Predictive outcome" value="Approvals likely to increase 5%" />
          <InfoBlock title="Capacity warning" value="2 officer queues nearing SLA breach" />
        </div>
      </SectionCard>

      <div className="grid gap-4 xl:grid-cols-2">
        <SectionCard title="Monthly claims trend" description="Submitted vs approved vs rejected (last 6 months).">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="label" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="claims" name="Submitted" fill="#2563eb" radius={[8, 8, 0, 0]} />
                <Bar dataKey="approved" name="Approved" fill="#16a34a" radius={[8, 8, 0, 0]} />
                <Bar dataKey="rejected" name="Rejected" fill="#ef4444" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

        <SectionCard title="Claim status distribution" description="Current portfolio split by workflow status.">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={statusBreakdown} dataKey="value" nameKey="name" innerRadius={62} outerRadius={96} paddingAngle={2}>
                  {statusBreakdown.map((entry, index) => (
                    <Cell key={entry.name} fill={pieColors[index % pieColors.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>
      </div>
    </GenericPage>
  );
};

export const ClaimPerformanceReportsPage = () => {
  const { data: claims = [] } = useClaims();
  const { user } = useAuth();
  return (
    <GenericPage eyebrow="Performance Reports" title="Claim performance reporting" description="Monitor processing speed, approval ratios, and officer productivity.">
      <SectionCard
        title="Report table"
        action={
          <div className="flex flex-wrap gap-2">
            <button
              className="btn-secondary"
              type="button"
              onClick={() =>
                downloadCsv(`performance-report-${new Date().toISOString().slice(0, 10)}.csv`, claims.map((claim) => ({
                  claimId: claim.id,
                  officer: claim.assignedOfficer,
                  team: claim.assignedTeam,
                  status: claim.status,
                  region: claim.region,
                  riskScore: claim.riskScore
                })))
              }
            >
              CSV
            </button>
            <button
              className="btn-primary"
              type="button"
              onClick={async () => {
                try {
                  const { generateClaimsPortfolioPdf } = await import("@/utils/pdfReport");
                  await generateClaimsPortfolioPdf(claims, {
                    title: "Claim performance report",
                    generatedBy: user?.name ?? "System user",
                    generatedByRole: user?.role,
                    generatedAt: new Date()
                  });
                  toast.success("PDF downloaded.");
                } catch {
                  toast.error("PDF export failed.");
                }
              }}
            >
              PDF report
            </button>
          </div>
        }
      >
        <ClaimsTable claims={claims} />
      </SectionCard>
    </GenericPage>
  );
};

export const TrendAnalysisPage = () => (
  <GenericPage eyebrow="Trend Analysis" title="Trend analysis by time, region, and claim type" description="Expose change patterns and predictive movement for decision support.">
    <SectionCard title="Trend filters">{filters}</SectionCard>
    <SectionCard title="Predictive analytics cards">
      <div className="grid gap-4 md:grid-cols-3">
        <InfoBlock title="Time trend" value="Auto claims +8%" />
        <InfoBlock title="Regional trend" value="Western fraud spikes" />
        <InfoBlock title="Outcome prediction" value="12% fewer delays expected" />
      </div>
    </SectionCard>
  </GenericPage>
);

export const ComplianceDashboardPage = () => (
  <GenericPage eyebrow="Compliance Dashboard" title="Compliance status and audit readiness" description="Track scheduled reports, retention windows, and open control exceptions.">
    <SectionCard title="Compliance checklist">
      <div className="space-y-3">
        <QueueRow title="Regulatory monthly report" subtitle="Ready for export and sign-off" tag="Complete" />
        <QueueRow title="Retention archive review" subtitle="Due in 3 days" tag="Due Soon" />
        <QueueRow title="Fraud audit sample" subtitle="2 records awaiting supervisor confirmation" tag="Action Needed" />
      </div>
    </SectionCard>
  </GenericPage>
);

export { ReportBuilderPage } from "@/pages/ReportBuilderPage";

export const RegulatoryTemplatesPage = () => (
  <GenericPage eyebrow="Regulatory Templates" title="Regulatory reporting templates" description="Store approved templates for compliance submissions and insurer governance packs.">
    <SectionCard title="Template library">
      <div className="grid gap-4 md:grid-cols-2">
        <InfoBlock title="RRA submission pack" value="Ready" />
        <InfoBlock title="Fraud summary template" value="Approved" />
        <InfoBlock title="Quarterly board summary" value="Needs refresh" />
        <InfoBlock title="Retention index" value="Current" />
      </div>
    </SectionCard>
  </GenericPage>
);

export const AuditTrailExplorerPage = () => (
  <GenericPage eyebrow="Audit Explorer" title="Audit trail explorer" description="Inspect user actions, overrides, sign-offs, and chain-of-custody activity.">
    <SectionCard title="Audit stream">
      <div className="space-y-3">
        <QueueRow title="Manual verification override" subtitle="Grace Uwase approved CLM-24091" tag="Officer Action" />
        <QueueRow title="Evidence access event" subtitle="Secure preview opened by Fraud Officer" tag="Tracked" />
        <QueueRow title="Report export event" subtitle="Compliance dashboard exported to PDF" tag="Tracked" />
      </div>
    </SectionCard>
  </GenericPage>
);

export const RoleManagementPage = () => (
  <GenericPage eyebrow="Role Management" title="Manage platform roles" description="Configure role definitions, assignment scope, and approval authority.">
    <SectionCard title="Roles catalog">
      <div className="space-y-3">
        {["Claimant", "Insurance Agent", "Claim Officer", "Supervisor", "Administrator", "Fraud Investigation Officer"].map((role) => (
          <QueueRow key={role} title={role} subtitle="Scoped permissions and dashboard visibility" tag="Active" />
        ))}
      </div>
    </SectionCard>
  </GenericPage>
);

export const PermissionMatrixPage = () => (
  <GenericPage eyebrow="Permission Matrix" title="Permission editor matrix" description="Review and manage create, view, approve, export, and administer permissions across roles.">
    <SectionCard title="Matrix snapshot">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Claims</th>
              <th className="px-4 py-3">Verification</th>
              <th className="px-4 py-3">Reports</th>
              <th className="px-4 py-3">Admin</th>
            </tr>
          </thead>
          <tbody>
            {demoUsers.map((user) => (
              <tr key={user.id} className="border-t border-slate-100">
                <td className="px-4 py-3 capitalize">{user.role}</td>
                <td className="px-4 py-3">Scoped</td>
                <td className="px-4 py-3">{user.role === "claimant" ? "No" : "Yes"}</td>
                <td className="px-4 py-3">{user.role === "admin" ? "Full" : "Limited"}</td>
                <td className="px-4 py-3">{user.role === "admin" ? "Full" : "No"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SectionCard>
  </GenericPage>
);

export const LoginActivityPage = () => (
  <GenericPage eyebrow="Activity Logs" title="Login activity and access logs" description="Monitor sign-ins, session behavior, device trust, and suspicious login attempts.">
    <SectionCard title="Recent activity">
      <div className="space-y-3">
        <QueueRow title="Admin login" subtitle="Kigali office · Chrome · 08:40" tag="Success" />
        <QueueRow title="OTP verification" subtitle="Claim Officer · Mobile app session" tag="Success" />
        <QueueRow title="Unknown attempt blocked" subtitle="Fraud alert triggered on untrusted device" tag="Blocked" />
      </div>
    </SectionCard>
  </GenericPage>
);

export const SecuritySettingsPage = () => (
  <GenericPage eyebrow="Security Settings" title="Security policies and session controls" description="Configure password rules, session timeout, MFA requirements, and access hardening.">
    <SectionCard title="Security controls">
      <div className="grid gap-4 md:grid-cols-2">
        <InfoBlock title="Password policy" value="12+ chars, symbol required" />
        <InfoBlock title="Session timeout" value="15 minutes idle" />
        <InfoBlock title="2FA policy" value="Required for staff roles" />
        <InfoBlock title="Alert thresholds" value="High sensitivity" />
      </div>
    </SectionCard>
  </GenericPage>
);

export const RiskScoringDashboardPage = () => {
  const { data: claims = [] } = useClaims();
  const avgRisk = claims.length ? Math.round(claims.reduce((s, c) => s + c.riskScore, 0) / claims.length) : 0;
  const highRisk = claims.filter((c) => c.riskScore >= 25).length;
  const investigating = claims.filter((c) => c.status === "Investigation").length;

  return (
    <GenericPage eyebrow="Risk Scoring" title="Risk scoring dashboard" description="Surface AI confidence, fraud probability, and recommended action levels.">
      <div className="dashboard-stat-band">
        <MetricCardGrid columns={4}>
          <MetricCard title="Average risk" value={String(avgRisk)} detail="Portfolio-wide risk score" icon={Gauge} variant="forest" trend={{ label: "Portfolio avg", direction: "neutral" }} />
          <MetricCard title="High-risk claims" value={String(highRisk)} detail="Risk score 25+" icon={AlertTriangle} variant="rose" trend={{ label: "Elevated", direction: highRisk ? "up" : "down" }} />
          <MetricCard title="Under investigation" value={String(investigating)} detail="Active fraud reviews" icon={BrainCircuit} variant="violet" trend={{ label: "Open cases", direction: investigating ? "up" : "neutral" }} />
          <MetricCard title="Total claims" value={String(claims.length)} detail="In database" icon={Bot} variant="teal" trend={{ label: "All records", direction: "neutral" }} />
        </MetricCardGrid>
      </div>
      <Link to="/fraud/flagged-claims" className="btn-primary mt-6 inline-flex">Open flagged queue</Link>
    </GenericPage>
  );
};

export const FlaggedClaimsQueuePage = () => {
  const { data: claims = [] } = useClaims();
  const flagged = claims.filter((c) => c.riskScore >= 25 || c.status === "Investigation");
  return (
    <GenericPage eyebrow="Flagged Claims" title="Flagged claims queue" description="Live high-risk claims from the database.">
      <SectionCard title="Flagged queue">
        <div className="space-y-3">
          {flagged.map((claim) => (
            <Link key={claim.id} to={`/claims/${claim.id}`} className="block rounded-2xl transition hover:bg-slate-50">
              <QueueRow title={claim.id} subtitle={claim.aiSummary} tag={`Risk ${claim.riskScore}`} />
            </Link>
          ))}
        </div>
        <Link to="/fraud/investigator-workspace" className="btn-primary mt-6 inline-flex">
          Open investigator workspace
        </Link>
      </SectionCard>
    </GenericPage>
  );
};

export const FraudPatternVisualizationPage = () => (
  <GenericPage eyebrow="Fraud Patterns" title="Network fraud visualization" description="Visual placeholder for relationship mapping, clusters, and historical case links.">
    <SectionCard title="Pattern visualization">
      <div className="grid h-80 place-items-center rounded-3xl bg-[linear-gradient(135deg,#eff6ff,#e0e7ff,#ecfdf5)]">
        <div className="text-center">
          <p className="text-lg font-semibold text-slate-900">Fraud network graph area</p>
          <p className="mt-2 text-sm text-slate-500">Claimants, garages, phones, accounts, and repeat incident links can be rendered here.</p>
        </div>
      </div>
    </SectionCard>
  </GenericPage>
);

export const InvestigatorWorkspacePage = () => {
  const { data: claims = [] } = useClaims();
  const flagged = claims.filter((c) => c.riskScore >= 25);
  const [selected, setSelected] = useState(flagged[0] ?? null);
  const active = selected ?? flagged[0];
  const addNote = useAddClaimNote();
  const { user } = useAuth();
  const [note, setNote] = useState("");

  return (
    <GenericPage eyebrow="Investigator Workspace" title="Fraud investigator workspace" description="Review flagged claims, start investigations, and save notes.">
      <div className="grid gap-6 xl:grid-cols-2">
        <ClaimQueueList claims={flagged} selectedId={active?.id} onSelect={setSelected} emptyLabel="No flagged claims." />
        <SectionCard title="Investigation actions">
          <textarea className="input min-h-32" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Investigation findings..." />
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              className="btn-gold"
              disabled={!active || addNote.isPending}
              onClick={() => {
                if (!active || !note.trim()) return;
                addNote.mutate(
                  { claimId: active.id, note: note.trim(), actor: user?.name ?? "Investigator" },
                  { onSuccess: () => { toast.success("Note saved."); setNote(""); } }
                );
              }}
            >
              Save note
            </button>
          </div>
          <div className="mt-6">
            <ClaimActionButtons claim={active} showInvestigate showOpenLink />
          </div>
        </SectionCard>
      </div>
    </GenericPage>
  );
};

export const MessageTemplatesPage = () => {
  const createNotification = useCreateNotification();
  const templates = [
    { title: "Missing document request", body: "Please upload the missing document for your claim.", status: "Action Needed" as const },
    { title: "Claim approved", body: "Your claim has been approved.", status: "Unread" as const },
    { title: "Fraud escalation notice", body: "Claim referred to fraud investigation.", status: "Unread" as const }
  ];
  return (
    <GenericPage eyebrow="Templates Library" title="Message templates library" description="Publish templates to the live notification center.">
      <SectionCard title="Communication templates" action={<Link to="/notifications" className="btn-secondary">Back to inbox</Link>}>
        <div className="space-y-3">
          {templates.map((t) => (
            <button key={t.title} type="button" className="action-tile w-full text-left" disabled={createNotification.isPending} onClick={() => createNotification.mutate(t, { onSuccess: () => toast.success("Template published.") })}>
              <span>{t.title}</span>
              <span className="text-xs text-prime-700">Publish</span>
            </button>
          ))}
        </div>
      </SectionCard>
    </GenericPage>
  );
};

export const NotificationSchedulerPage = () => {
  const createNotification = useCreateNotification();
  const [title, setTitle] = useState("Scheduled reminder");
  const [body, setBody] = useState("This is your automated claim status reminder.");
  const [channel, setChannel] = useState("In-App");

  return (
    <GenericPage eyebrow="Notification Scheduler" title="Automated notification scheduler" description="Create scheduled in-app notifications for claimants and staff.">
      <SectionCard title="Scheduling rules">
        <div className="grid gap-4 md:grid-cols-2">
          <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Schedule name" />
          <select className="input" value={channel} onChange={(e) => setChannel(e.target.value)}>
            <option>SMS</option><option>Email</option><option>In-App</option>
          </select>
          <textarea className="input md:col-span-2 min-h-24" value={body} onChange={(e) => setBody(e.target.value)} placeholder="Message body" />
        </div>
        <button
          type="button"
          className="btn-primary mt-5"
          disabled={createNotification.isPending}
          onClick={() =>
            createNotification.mutate(
              { title: `[${channel}] ${title}`, body, status: "Unread" },
              { onSuccess: () => toast.success("Notification scheduled and published.") }
            )
          }
        >
          Publish notification
        </button>
      </SectionCard>
    </GenericPage>
  );
};

export const DeliveryTrackingPage = () => {
  const { data: notifications = [] } = useNotifications();
  const markRead = useMarkNotificationRead();

  return (
    <GenericPage eyebrow="Delivery Tracking" title="Delivery tracking and response capture" description="Track in-app notification delivery and read status.">
      <SectionCard title="Delivery status" action={<Link to="/notifications/scheduler" className="btn-secondary">Schedule notification</Link>}>
        <div className="space-y-3">
          {notifications.map((item) => (
            <div key={item.id} className="rounded-2xl border border-slate-200 p-4">
              <QueueRow title={item.title} subtitle={item.body} tag={item.status} />
              {item.status !== "Read" ? (
                <button
                  type="button"
                  className="btn-secondary mt-3"
                  disabled={markRead.isPending}
                  onClick={() => markRead.mutate(item.id, { onSuccess: () => toast.success("Marked delivered/read.") })}
                >
                  Mark read
                </button>
              ) : null}
            </div>
          ))}
          {!notifications.length ? <p className="text-sm text-slate-500">No notifications yet.</p> : null}
        </div>
      </SectionCard>
    </GenericPage>
  );
};

export const ProfilePage = () => {
  const { user, updateProfile } = useAuth();
  const [name, setName] = useState(user?.name ?? "");
  const [department, setDepartment] = useState(user?.department ?? "HQ");

  return (
    <GenericPage eyebrow="Profile" title="User profile" description="Manage account identity and workspace details.">
      <SectionCard title="Profile details">
        <div className="grid gap-4 md:grid-cols-2">
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" />
          <input className="input" value={user?.email ?? ""} readOnly />
          <input className="input" value={department} onChange={(e) => setDepartment(e.target.value)} placeholder="Department" />
          <input className="input" value={user?.role ?? ""} readOnly />
        </div>
        <button
          type="button"
          className="btn-primary mt-5"
          onClick={() => {
            updateProfile({ name, department });
            toast.success("Profile saved.");
          }}
        >
          Save profile
        </button>
      </SectionCard>
    </GenericPage>
  );
};

export const SettingsPage = () => (
  <GenericPage eyebrow="Settings" title="Application settings" description="Central place for workspace preferences, notifications, and security behavior.">
    <SectionCard title="Settings overview">
      <div className="grid gap-4 md:grid-cols-3">
        <InfoBlock title="Theme" value="Corporate blue" />
        <InfoBlock title="Notifications" value="Enabled" />
        <InfoBlock title="Session mode" value="Secure timeout" />
      </div>
      <div className="mt-5 flex flex-wrap gap-3">
        <Link to="/notifications" className="btn-primary">Notification settings</Link>
        <Link to="/notifications/templates" className="btn-secondary">Communication templates</Link>
        <Link to="/admin/security" className="btn-secondary">Security settings</Link>
      </div>
    </SectionCard>
  </GenericPage>
);

export const HelpSupportPage = () => (
  <div className="min-h-screen bg-mist">
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <Link to="/" className="text-sm font-semibold text-prime-700 hover:text-prime-800">
        ← Back to home
      </Link>
      <img src={primeLogo} alt="Prime Insurance" className="mt-6 h-10 w-auto" />
      <h1 className="mt-4 text-3xl font-extrabold text-navy-900">Help & support</h1>
      <p className="mt-2 text-sm leading-relaxed text-slate-600">
        Ask about claims, documents, tracking, and roles. After you sign in, the same chat is available from the Help
        button at the bottom-right of every page.
      </p>
      <div className="mt-8">
        <SystemHelpChat title="Claims help assistant" />
      </div>
      <div className="card mt-8 grid gap-4 p-6 sm:grid-cols-2">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Phone</p>
          <p className="mt-1 font-semibold text-navy-900">+250 788 150 100</p>
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Toll-free</p>
          <p className="mt-1 font-semibold text-navy-900">1320</p>
        </div>
      </div>
    </div>
  </div>
);

export const AboutSystemPage = () => (
  <GenericPage
    eyebrow="System overview"
    title="Digital Claims Verification & Decision System"
    description="Verification and decision workflow only — no payment or billing modules."
  >
    <SectionCard title="How it works">
      <p className="text-sm leading-7 text-slate-600">
        Claimants submit claims and evidence. AI analyzes documents and flags fraud risk. Officers and investigators review
        cases and make final decisions. The system records approved or rejected outcomes and keeps a full audit trail.
      </p>
    </SectionCard>
    <SectionCard title="Core modules">
      <ul className="list-inside list-disc space-y-2 text-sm text-slate-700">
        <li>User authentication & access control</li>
        <li>Digital claim submission</li>
        <li>Evidence management</li>
        <li>AI document verification</li>
        <li>AI fraud detection</li>
        <li>Claim evaluation & decision</li>
        <li>Claim tracking</li>
        <li>Communication & notification center</li>
        <li>Reporting & compliance</li>
        <li>Data analytics & insights</li>
      </ul>
    </SectionCard>
  </GenericPage>
);

export const ContactPage = () => {
  const createNotification = useCreateNotification();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) {
      toast.error("Fill in all fields.");
      return;
    }
    createNotification.mutate(
      { title: `Contact: ${name}`, body: `${email}: ${message}`, status: "Unread" },
      {
        onSuccess: () => {
          toast.success("Message sent to the support inbox.");
          setName("");
          setEmail("");
          setMessage("");
        },
        onError: () => toast.error("Could not send message.")
      }
    );
  };

  return (
    <GenericPage eyebrow="Contact" title="Contact Prime Insurance platform team" description="Submit inquiries — they appear in the notification center for staff.">
      <SectionCard title="Contact form">
        <form className="grid gap-4 md:grid-cols-2" onSubmit={submit}>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" required />
          <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" required />
          <textarea className="input min-h-36 md:col-span-2" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Message" required />
          <button type="submit" className="btn-primary md:col-span-2" disabled={createNotification.isPending}>Send message</button>
        </form>
      </SectionCard>
    </GenericPage>
  );
};


export const UnauthorizedPage = () => (
  <CenteredMessage
    title="Unauthorized access"
    description="Your role does not have permission to open this page. Please contact an administrator if this seems incorrect."
  />
);

export const NotFoundPage = () => (
  <CenteredMessage title="Page not found" description="The page you requested does not exist or may have been moved." />
);

const CenteredMessage = ({ title, description }: { title: string; description: string }) => (
  <div className="flex min-h-screen items-center justify-center bg-mist px-4">
    <div className="card max-w-lg p-8 text-center">
      <p className="text-3xl font-extrabold text-navy-900">{title}</p>
      <p className="mt-3 text-sm text-slate-500">{description}</p>
      <Link to="/" className="btn-primary mt-6">Return home</Link>
    </div>
  </div>
);

const GenericPage = ({
  eyebrow,
  title,
  description,
  metrics,
  children
}: {
  eyebrow: string;
  title: string;
  description: string;
  metrics?: [string, string, string][];
  children: ReactNode;
}) => (
  <div className="space-y-6">
    <PageHeader eyebrow={eyebrow} title={title} description={description} />
    {metrics ? (
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map(([label, value, detail]) => (
          <InfoBlock key={label} title={label} value={value} detail={detail} />
        ))}
      </div>
    ) : null}
    {children}
  </div>
);

const InfoBlock = ({
  title,
  value,
  detail
}: {
  title: string;
  value: string;
  detail?: string;
}) => (
  <div className="rounded-3xl border border-slate-200 bg-white p-5">
    <p className="text-sm text-slate-500">{title}</p>
    <p className="mt-3 text-xl font-bold text-slate-900">{value}</p>
    {detail ? <p className="mt-2 text-sm text-slate-500">{detail}</p> : null}
  </div>
);

const FieldError = ({ value, children }: { value?: string; children: ReactNode }) => (
  <label className="block">
    {children}
    {value ? <span className="mt-1 block text-xs font-medium text-rose-600">{value}</span> : null}
  </label>
);

const PreviewBox = ({ label }: { label: string }) => (
  <div className="grid h-52 place-items-center rounded-3xl border border-dashed border-slate-300 bg-slate-50 text-center text-sm text-slate-500">
    {label}
  </div>
);

const QueueRow = ({ title, subtitle, tag }: { title: string; subtitle: string; tag: string }) => (
  <div className="flex items-start justify-between gap-4 rounded-2xl border border-slate-200 p-4">
    <div>
      <p className="font-semibold text-slate-900">{title}</p>
      <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
    </div>
    <span className="rounded-full bg-prime-50 px-3 py-1 text-xs font-semibold text-prime-700">{tag}</span>
  </div>
);

/** @deprecated Use `@/config/sidebarNavigation` — kept for backward compatibility. */
export { defaultSidebarLinks as enterpriseSidebarLinks } from "@/config/sidebarNavigation";

export const aiFeatureCards = [
  { label: "OCR verification", icon: ScanSearch },
  { label: "Fraud detection alerts", icon: AlertTriangle },
  { label: "Risk scoring engine", icon: Gauge },
  { label: "Predictive outcomes", icon: BrainCircuit },
  { label: "Smart claim routing", icon: ArrowRight },
  { label: "AI recommendations", icon: Bot },
  { label: "Smart notifications", icon: MailCheck },
  { label: "Pattern recognition", icon: Network },
  { label: "Approval suggestions", icon: ShieldCheck }
];
