// src/app/(auth)/login/page.tsx
"use client";

import { useState, useEffect } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Mail, ArrowRight, RefreshCw, ChevronLeft, ShieldCheck, Lock, Eye, EyeOff } from "lucide-react";
import { cn, validateEmail } from "@/lib/utils";

type Mode = "signin" | "signup";
type OtpStep = "identifier" | "otp";

export default function LoginPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawCallback = searchParams.get("callbackUrl") || "/feed";
  const callbackUrl =
    rawCallback.startsWith("/") && !rawCallback.startsWith("//") ? rawCallback : "/feed";

  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  const [useOtpFlow, setUseOtpFlow] = useState(false);
  const [otpStep, setOtpStep] = useState<OtpStep>("identifier");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (session) router.replace(callbackUrl);
  }, [session, callbackUrl, router]);

  useEffect(() => {
    if (resendCooldown > 0) {
      const t = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [resendCooldown]);

  // ----------- Google sign-in -----------
  const handleGoogle = () => {
    setError("");
    setLoading(true);
    signIn("google", { callbackUrl });
  };

  // ----------- Email + password -----------
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setInfo("");

    const cleanEmail = email.trim().toLowerCase();
    if (!validateEmail(cleanEmail)) {
      setError("Enter a valid email address");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setLoading(true);
    try {
      if (mode === "signup") {
        const res = await fetch("/api/auth/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: cleanEmail, password }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Sign-up failed");
      }
      const result = await signIn("password", {
        email: cleanEmail,
        password,
        redirect: false,
      });
      if (result?.error) throw new Error("Wrong email or password");
      router.replace(callbackUrl);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ----------- OTP fallback flow -----------
  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const cleanEmail = email.trim().toLowerCase();
    if (!validateEmail(cleanEmail)) {
      setError("Enter a valid email address");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: cleanEmail }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send code");
      setOtpStep("otp");
      setResendCooldown(60);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOTPInput = (index: number, value: string) => {
    if (value.length > 1) {
      const digits = value.replace(/\D/g, "").slice(0, 6);
      const newOtp = [...otp];
      digits.split("").forEach((d, i) => { if (i < 6) newOtp[i] = d; });
      setOtp(newOtp);
      const nextEmpty = newOtp.findIndex((v, i) => i >= digits.length && !v);
      const focusIndex = nextEmpty === -1 ? 5 : nextEmpty;
      document.getElementById(`otp-${focusIndex}`)?.focus();
      return;
    }
    const newOtp = [...otp];
    newOtp[index] = value.replace(/\D/g, "");
    setOtp(newOtp);
    if (value && index < 5) document.getElementById(`otp-${index + 1}`)?.focus();
  };

  const handleOTPKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      document.getElementById(`otp-${index - 1}`)?.focus();
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const code = otp.join("");
    if (code.length < 6) { setError("Enter the full 6-digit code"); return; }
    setLoading(true);
    try {
      const result = await signIn("otp", {
        identifier: email.trim().toLowerCase(),
        otp: code,
        redirect: false,
      });
      if (result?.error) throw new Error("Invalid or expired code");
      router.replace(callbackUrl);
    } catch (err: any) {
      setError(err.message);
      setOtp(["", "", "", "", "", ""]);
      document.getElementById("otp-0")?.focus();
    } finally {
      setLoading(false);
    }
  };

  const resetOtpFlow = () => {
    setUseOtpFlow(false);
    setOtpStep("identifier");
    setOtp(["", "", "", "", "", ""]);
    setError("");
  };

  // ----------- Render -----------
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-whisper-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-saffron-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🤫</div>
          <h1 className="font-display font-bold text-2xl gradient-text">WorkWhisper</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Anonymous workplace insights, worldwide
          </p>
        </div>

        <div className="whisper-card p-6">
          {useOtpFlow ? (
            // ----- OTP flow -----
            otpStep === "identifier" ? (
              <>
                <button
                  onClick={resetOtpFlow}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors mb-4"
                >
                  <ChevronLeft className="w-4 h-4" /> Back
                </button>
                <h2 className="font-display font-semibold text-lg mb-1">Sign in with email code</h2>
                <p className="text-sm text-muted-foreground mb-5">
                  We&apos;ll email you a 6-digit code
                </p>
                <form onSubmit={handleSendOTP} className="space-y-4">
                  <Input
                    icon={<Mail className="w-4 h-4" />}
                    type="email"
                    value={email}
                    onChange={(v) => setEmail(v)}
                    placeholder="you@example.com"
                    autoComplete="email"
                  />
                  {error && <ErrorBox>{error}</ErrorBox>}
                  <PrimaryButton loading={loading} disabled={!email}>
                    Send code <ArrowRight className="w-4 h-4" />
                  </PrimaryButton>
                </form>
              </>
            ) : (
              <>
                <button
                  onClick={() => { setOtpStep("identifier"); setOtp(["", "", "", "", "", ""]); setError(""); }}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors mb-4"
                >
                  <ChevronLeft className="w-4 h-4" /> Back
                </button>
                <h2 className="font-display font-semibold text-lg mb-1">Check your email</h2>
                <p className="text-sm text-muted-foreground mb-5">
                  We sent a 6-digit code to <span className="font-medium text-foreground">{email}</span>
                </p>
                <form onSubmit={handleVerifyOTP} className="space-y-4">
                  <div className="flex gap-2 justify-center">
                    {otp.map((digit, i) => (
                      <input
                        key={i}
                        id={`otp-${i}`}
                        type="text"
                        inputMode="numeric"
                        value={digit}
                        onChange={(e) => handleOTPInput(i, e.target.value)}
                        onKeyDown={(e) => handleOTPKeyDown(i, e)}
                        onPaste={(e) => { e.preventDefault(); handleOTPInput(i, e.clipboardData.getData("text")); }}
                        maxLength={6}
                        className={cn(
                          "w-11 h-12 text-center text-lg font-bold rounded-lg border bg-muted",
                          "focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all",
                          digit ? "border-whisper-500/50 bg-whisper-500/5" : "border-border"
                        )}
                        autoFocus={i === 0}
                      />
                    ))}
                  </div>
                  {error && <ErrorBox>{error}</ErrorBox>}
                  <PrimaryButton loading={loading} disabled={otp.join("").length < 6}>
                    Verify & sign in
                  </PrimaryButton>
                </form>
                <div className="mt-4 text-center">
                  <button
                    onClick={async () => {
                      if (resendCooldown > 0) return;
                      setError("");
                      setLoading(true);
                      try {
                        await fetch("/api/auth/otp/send", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ identifier: email.trim().toLowerCase() }),
                        });
                        setResendCooldown(60);
                        setOtp(["", "", "", "", "", ""]);
                      } finally { setLoading(false); }
                    }}
                    disabled={resendCooldown > 0 || loading}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
                  >
                    {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Didn't receive it? Resend code"}
                  </button>
                </div>
              </>
            )
          ) : (
            // ----- Main flow: Google + password -----
            <>
              <div className="flex bg-muted rounded-lg p-1 mb-5 text-sm">
                <button
                  type="button"
                  onClick={() => { setMode("signin"); setError(""); setInfo(""); }}
                  className={cn(
                    "flex-1 py-1.5 rounded-md font-medium transition",
                    mode === "signin" ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Sign in
                </button>
                <button
                  type="button"
                  onClick={() => { setMode("signup"); setError(""); setInfo(""); }}
                  className={cn(
                    "flex-1 py-1.5 rounded-md font-medium transition",
                    mode === "signup" ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Create account
                </button>
              </div>

              <button
                onClick={handleGoogle}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2.5 py-2.5 rounded-lg font-medium text-sm bg-background border border-border hover:bg-muted transition-colors disabled:opacity-50"
              >
                <GoogleIcon />
                Continue with Google
              </button>

              <div className="flex items-center gap-3 my-5">
                <div className="flex-1 h-px bg-border" />
                <span className="text-[11px] uppercase tracking-wider text-muted-foreground">or</span>
                <div className="flex-1 h-px bg-border" />
              </div>

              <form onSubmit={handlePasswordSubmit} className="space-y-3">
                <Input
                  icon={<Mail className="w-4 h-4" />}
                  type="email"
                  value={email}
                  onChange={setEmail}
                  placeholder="you@example.com"
                  autoComplete="email"
                />
                <Input
                  icon={<Lock className="w-4 h-4" />}
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={setPassword}
                  placeholder={mode === "signup" ? "At least 8 characters" : "Your password"}
                  autoComplete={mode === "signup" ? "new-password" : "current-password"}
                  rightAdornment={
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="text-muted-foreground hover:text-foreground"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  }
                />
                {error && <ErrorBox>{error}</ErrorBox>}
                {info && (
                  <div className="text-xs text-green-600 bg-green-500/10 border border-green-500/20 rounded-lg px-3 py-2">
                    {info}
                  </div>
                )}
                <PrimaryButton loading={loading} disabled={!email || password.length < 8}>
                  {mode === "signup" ? "Create account" : "Sign in"} <ArrowRight className="w-4 h-4" />
                </PrimaryButton>
              </form>

              <div className="mt-4 text-center">
                <button
                  onClick={() => { setUseOtpFlow(true); setError(""); }}
                  className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2"
                >
                  Use email code instead
                </button>
              </div>

              <div className="mt-4 p-3 rounded-lg bg-muted/50 flex items-start gap-2 text-xs text-muted-foreground">
                <ShieldCheck className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                <span>Your identity stays private. We generate an anonymous username for you.</span>
              </div>
            </>
          )}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          By continuing, you agree to our{" "}
          <a href="/terms" className="hover:text-foreground transition-colors underline underline-offset-2">Terms</a>
          {" "}and{" "}
          <a href="/privacy" className="hover:text-foreground transition-colors underline underline-offset-2">Privacy Policy</a>
        </p>
      </div>
    </div>
  );
}

function Input({
  icon,
  rightAdornment,
  value,
  onChange,
  ...rest
}: {
  icon: React.ReactNode;
  rightAdornment?: React.ReactNode;
  value: string;
  onChange: (v: string) => void;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "value">) {
  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">{icon}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required
        className={cn(
          "w-full pl-9 pr-9 py-2.5 text-sm bg-muted border border-border rounded-lg",
          "focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent",
          rightAdornment ? "pr-10" : "pr-4"
        )}
        {...rest}
      />
      {rightAdornment && (
        <span className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center">{rightAdornment}</span>
      )}
    </div>
  );
}

function ErrorBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">
      {children}
    </div>
  );
}

function PrimaryButton({
  loading,
  disabled,
  children,
}: {
  loading?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="submit"
      disabled={loading || disabled}
      className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg font-semibold text-sm bg-whisper-500 hover:bg-whisper-600 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : children}
    </button>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
      <path fill="#4285F4" d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.614z"/>
      <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.836.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/>
      <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.997 8.997 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/>
      <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/>
    </svg>
  );
}
