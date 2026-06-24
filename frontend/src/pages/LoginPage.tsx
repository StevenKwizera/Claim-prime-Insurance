import { FormEvent, useState } from "react";
import { ArrowRight } from "lucide-react";
import toast from "react-hot-toast";
import { Link, useNavigate } from "react-router-dom";
import { LoginVideoLayout } from "@/components/LoginVideoLayout";
import { AUTH_STORAGE_KEY } from "@/constants/auth";
import { backendService } from "@/services/backend";
import { useAuthStore } from "@/store/authStore";
import { User } from "@/types";

export const LoginPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [otpStep, setOtpStep] = useState(false);
  const [otpHint, setOtpHint] = useState("");
  const [devCode, setDevCode] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const finishLogin = (token: string, user: User) => {
    const normalized =
      (user as unknown as { role: string }).role === "super-admin" ? { ...user, role: "admin" as const } : user;
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ user: normalized, token }));
    useAuthStore.setState({ user: normalized, token });
    navigate("/dashboard");
  };

  const handlePasswordLogin = async (event: FormEvent) => {
    event.preventDefault();
    if (!email.trim() || !password.trim()) {
      toast.error("Email and password are required.");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await backendService.login({
        email: email.trim().toLowerCase(),
        password: password.trim()
      });
      if (result.type === "otp_required") {
        setOtpStep(true);
        setOtpHint(result.message);
        setDevCode(result.devCode ?? null);
        if (result.devCode) {
          setOtp(result.devCode);
        }
        toast.success(
          result.emailSent === false
            ? "Email could not be sent — use the code shown below."
            : "Check your email for the verification code."
        );
        return;
      }
      finishLogin(result.token, result.user);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Login failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOtpLogin = async (event: FormEvent) => {
    event.preventDefault();
    if (otp.trim().length !== 6) {
      toast.error("Enter the 6-digit code from your email.");
      return;
    }
    setIsSubmitting(true);
    try {
      const result = await backendService.verifyLoginOtp({
        email: email.trim().toLowerCase(),
        password: password.trim(),
        code: otp.trim()
      });
      finishLogin(result.token, result.user);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Verification failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resendLoginOtp = async () => {
    setIsResending(true);
    try {
      const result = await backendService.sendOtp(email.trim().toLowerCase(), "login");
      if (result.devCode) {
        setDevCode(result.devCode);
        setOtp(result.devCode);
      }
      toast.success(result.message);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not resend code.");
    } finally {
      setIsResending(false);
    }
  };

  return (
    <LoginVideoLayout title="Sign in" description={otpStep ? otpHint : undefined}>
      {!otpStep ? (
        <form onSubmit={handlePasswordLogin} className="space-y-4">
          <input
            className="input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            autoComplete="email"
            required
          />
          <input
            className="input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            autoComplete="current-password"
            required
          />
          <button type="submit" className="btn-primary w-full gap-2" disabled={isSubmitting}>
            {isSubmitting ? "Signing in..." : "Sign in"}
            <ArrowRight className="h-4 w-4" />
          </button>
          <Link to="/forgot-password" className="btn-secondary block w-full text-center">
            Forgot password?
          </Link>
        </form>
      ) : (
        <form onSubmit={handleOtpLogin} className="space-y-4">
          <p className="text-sm text-slate-600">
            Password accepted — enter the 6-digit code sent to <strong>{email}</strong>
          </p>
          {devCode ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-center">
              <p className="text-xs font-semibold uppercase tracking-wide text-amber-800">Verification code</p>
              <p className="mt-2 font-mono text-2xl font-bold tracking-[0.35em] text-amber-950">{devCode}</p>
              <p className="mt-2 text-xs text-amber-700">Shown because the email could not be delivered.</p>
            </div>
          ) : null}
          <input
            className="input text-center text-lg font-bold tracking-[0.35em]"
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="000000"
            inputMode="numeric"
            maxLength={6}
            required
          />
          <button type="submit" className="btn-primary w-full" disabled={isSubmitting}>
            {isSubmitting ? "Verifying..." : "Verify and sign in"}
          </button>
          <button type="button" className="btn-secondary w-full" disabled={isResending} onClick={() => void resendLoginOtp()}>
            {isResending ? "Sending..." : "Resend code"}
          </button>
          <button type="button" className="btn-secondary w-full" onClick={() => setOtpStep(false)}>
            Back
          </button>
        </form>
      )}

      <p className="mt-6 text-center text-sm text-slate-500">
        New customer?{" "}
        <Link to="/register" className="font-semibold text-prime-700">
          Register as claimant
        </Link>
      </p>
    </LoginVideoLayout>
  );
};
