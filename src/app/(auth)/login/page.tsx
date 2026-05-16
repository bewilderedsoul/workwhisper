// src/app/(auth)/login/page.tsx
"use client";

import { useState, useEffect } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Mail, ArrowRight, RefreshCw, ChevronLeft, ShieldCheck } from "lucide-react";
import { cn, validateEmail } from "@/lib/utils";

type Step = "identifier" | "otp";

export default function LoginPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawCallback = searchParams.get("callbackUrl") || "/feed";
  const callbackUrl =
    rawCallback.startsWith("/") && !rawCallback.startsWith("//") ? rawCallback : "/feed";

  const [step, setStep] = useState<Step>("identifier");
  const [identifier, setIdentifier] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (session) router.replace(callbackUrl);
  }, [session]);

  useEffect(() => {
    if (resendCooldown > 0) {
      const t = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [resendCooldown]);

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!validateEmail(identifier.trim())) {
      setError("Please enter a valid email address");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: identifier.trim().toLowerCase() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send OTP");
      setStep("otp");
      setResendCooldown(60);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOTPInput = (index: number, value: string) => {
    if (value.length > 1) {
      // Handle paste
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

    if (value && index < 5) {
      document.getElementById(`otp-${index + 1}`)?.focus();
    }
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
    if (code.length < 6) { setError("Please enter the full 6-digit code"); return; }

    setLoading(true);
    try {
      const result = await signIn("credentials", {
        identifier: identifier.trim().toLowerCase(),
        otp: code,
        redirect: false,
      });

      if (result?.error) throw new Error("Invalid or expired code. Please try again.");
      router.replace(callbackUrl);
    } catch (err: any) {
      setError(err.message);
      setOtp(["", "", "", "", "", ""]);
      document.getElementById("otp-0")?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: identifier.trim().toLowerCase() }),
      });
      if (!res.ok) throw new Error("Failed to resend");
      setResendCooldown(60);
      setOtp(["", "", "", "", "", ""]);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-whisper-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-saffron-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🤫</div>
          <h1 className="font-display font-bold text-2xl gradient-text">WorkWhisper</h1>
          <p className="text-sm text-muted-foreground mt-1">
            India's anonymous professional community
          </p>
        </div>

        {/* Card */}
        <div className="whisper-card p-6">
          {step === "identifier" ? (
            <>
              <div className="mb-5">
                <h2 className="font-display font-semibold text-lg">Sign in</h2>
                <p className="text-sm text-muted-foreground mt-0.5">
                  We'll send a one-time code to your email
                </p>
              </div>

              <form onSubmit={handleSendOTP} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                    Email address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type="email"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder="you@example.com"
                      autoComplete="email"
                      autoFocus
                      required
                      className="w-full pl-9 pr-4 py-2.5 text-sm bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                    />
                  </div>
                </div>

                {error && (
                  <div className="text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || !identifier}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg font-semibold text-sm bg-whisper-500 hover:bg-whisper-600 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <>Continue <ArrowRight className="w-4 h-4" /></>
                  )}
                </button>
              </form>

              <div className="mt-4 p-3 rounded-lg bg-muted/50 flex items-start gap-2 text-xs text-muted-foreground">
                <ShieldCheck className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                <span>Your identity stays private. We generate an anonymous username for you.</span>
              </div>
            </>
          ) : (
            <>
              <button
                onClick={() => { setStep("identifier"); setError(""); setOtp(["", "", "", "", "", ""]); }}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors mb-5"
              >
                <ChevronLeft className="w-4 h-4" /> Back
              </button>

              <div className="mb-5">
                <h2 className="font-display font-semibold text-lg">Check your email</h2>
                <p className="text-sm text-muted-foreground mt-0.5">
                  We sent a 6-digit code to{" "}
                  <span className="font-medium text-foreground">{identifier}</span>
                </p>
              </div>

              <form onSubmit={handleVerifyOTP} className="space-y-4">
                {/* OTP inputs */}
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
                      onPaste={(e) => {
                        e.preventDefault();
                        handleOTPInput(i, e.clipboardData.getData("text"));
                      }}
                      maxLength={6}
                      className={cn(
                        "w-11 h-12 text-center text-lg font-bold rounded-lg border bg-muted",
                        "focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent",
                        "transition-all",
                        digit ? "border-whisper-500/50 bg-whisper-500/5" : "border-border"
                      )}
                      autoFocus={i === 0}
                    />
                  ))}
                </div>

                {error && (
                  <div className="text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2 text-center">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || otp.join("").length < 6}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg font-semibold text-sm bg-whisper-500 hover:bg-whisper-600 text-white transition-colors disabled:opacity-50"
                >
                  {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : "Verify & Sign In"}
                </button>
              </form>

              <div className="mt-4 text-center">
                <button
                  onClick={handleResend}
                  disabled={resendCooldown > 0 || loading}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
                >
                  {resendCooldown > 0
                    ? `Resend in ${resendCooldown}s`
                    : "Didn't receive it? Resend code"}
                </button>
              </div>
            </>
          )}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          By signing in, you agree to our{" "}
          <a href="/terms" className="hover:text-foreground transition-colors underline underline-offset-2">Terms</a>
          {" "}and{" "}
          <a href="/privacy" className="hover:text-foreground transition-colors underline underline-offset-2">Privacy Policy</a>
        </p>
      </div>
    </div>
  );
}
