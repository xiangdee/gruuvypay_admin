"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// ── Password requirement helpers ────────────────────────────────────────────

interface Requirement {
  label: string;
  test: (v: string) => boolean;
}

const REQUIREMENTS: Requirement[] = [
  { label: "At least 8 characters", test: (v) => v.length >= 8 },
  { label: "One uppercase letter", test: (v) => /[A-Z]/.test(v) },
  { label: "One number", test: (v) => /[0-9]/.test(v) },
  {
    label: "One special character",
    test: (v) => /[^A-Za-z0-9]/.test(v),
  },
];

function RequirementItem({
  met,
  label,
}: {
  met: boolean;
  label: string;
}) {
  return (
    <li className="flex items-center gap-2 text-xs">
      {met ? (
        <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-green-400" />
      ) : (
        <XCircle className="h-3.5 w-3.5 shrink-0 text-white/30" />
      )}
      <span className={met ? "text-white/70" : "text-white/40"}>{label}</span>
    </li>
  );
}

// ── Validation states ────────────────────────────────────────────────────────

type TokenStatus = "checking" | "valid" | "invalid";
type ResetStatus = "idle" | "submitting" | "success";

// ── Inner component (uses useSearchParams) ───────────────────────────────────

function ResetPasswordInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [tokenStatus, setTokenStatus] = useState<TokenStatus>("checking");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetStatus, setResetStatus] = useState<ResetStatus>("idle");

  // Validate token on mount
  useEffect(() => {
    if (!token) {
      setTokenStatus("invalid");
      return;
    }

    const controller = new AbortController();

    async function validateToken() {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/admin/auth/validate-reset-token?token=${encodeURIComponent(token)}`,
          { signal: controller.signal }
        );
        setTokenStatus(res.ok ? "valid" : "invalid");
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          setTokenStatus("invalid");
        }
      }
    }

    validateToken();
    return () => controller.abort();
  }, [token]);

  const requirementsMet = REQUIREMENTS.map((r) => r.test(newPassword));
  const allRequirementsMet = requirementsMet.every(Boolean);
  const passwordsMatch = newPassword === confirmPassword;
  const canSubmit =
    allRequirementsMet &&
    passwordsMatch &&
    confirmPassword.length > 0 &&
    resetStatus === "idle";

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!canSubmit) return;

    setResetStatus("submitting");

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/auth/reset-password`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token, newPassword }),
        }
      );

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(
          (data as { message?: string }).message ??
            "Failed to reset password. Please try again."
        );
        setResetStatus("idle");
        return;
      }

      setResetStatus("success");

      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push("/login");
      }, 3000);
    } catch {
      toast.error("Network error. Please check your connection and try again.");
      setResetStatus("idle");
    }
  }

  // ── Checking token ──────────────────────────────────────────────────────────
  if (tokenStatus === "checking") {
    return (
      <Card className="border-white/10 bg-white/5 text-white shadow-2xl">
        <CardContent className="flex flex-col items-center gap-4 py-10">
          <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
          <p className="text-sm text-white/50">Validating your reset link…</p>
        </CardContent>
      </Card>
    );
  }

  // ── Invalid / expired token ─────────────────────────────────────────────────
  if (tokenStatus === "invalid") {
    return (
      <Card className="border-white/10 bg-white/5 text-white shadow-2xl">
        <CardHeader className="pb-2">
          <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10 ring-1 ring-red-500/30">
            <XCircle className="h-5 w-5 text-red-400" />
          </div>
          <CardTitle className="text-lg font-semibold text-white">
            Link expired
          </CardTitle>
          <CardDescription className="text-sm text-white/50">
            This link has expired. Request a new one.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/forgot-password">
            <Button className="h-9 w-full bg-blue-600 text-white hover:bg-blue-500 active:bg-blue-700">
              Request a new link
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  // ── Success ─────────────────────────────────────────────────────────────────
  if (resetStatus === "success") {
    return (
      <Card className="border-white/10 bg-white/5 text-white shadow-2xl">
        <CardHeader className="pb-2">
          <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-green-500/10 ring-1 ring-green-500/30">
            <CheckCircle2 className="h-5 w-5 text-green-400" />
          </div>
          <CardTitle className="text-lg font-semibold text-white">
            Password reset
          </CardTitle>
          <CardDescription className="text-sm text-white/50">
            Your password has been reset successfully. Redirecting you to
            login…
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-sm text-white/40">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Redirecting in 3 seconds
          </div>
        </CardContent>
      </Card>
    );
  }

  // ── Reset form ──────────────────────────────────────────────────────────────
  return (
    <Card className="border-white/10 bg-white/5 text-white shadow-2xl">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold text-white">
          Set new password
        </CardTitle>
        <CardDescription className="text-sm text-white/50">
          Choose a strong password for your account.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
          {/* New password */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="new-password" className="text-white/80">
              New password
            </Label>
            <Input
              id="new-password"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              disabled={resetStatus === "submitting"}
              className="border-white/10 bg-white/5 text-white placeholder:text-white/30 focus-visible:border-blue-500 focus-visible:ring-blue-500/20"
            />

            {/* Requirements checklist */}
            <ul className="mt-2 flex flex-col gap-1.5 rounded-lg border border-white/5 bg-white/[0.03] px-3 py-2.5">
              {REQUIREMENTS.map((req, i) => (
                <RequirementItem
                  key={req.label}
                  met={requirementsMet[i]}
                  label={req.label}
                />
              ))}
            </ul>
          </div>

          {/* Confirm password */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="confirm-password" className="text-white/80">
              Confirm password
            </Label>
            <Input
              id="confirm-password"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              disabled={resetStatus === "submitting"}
              className="border-white/10 bg-white/5 text-white placeholder:text-white/30 focus-visible:border-blue-500 focus-visible:ring-blue-500/20"
            />
            {confirmPassword.length > 0 && !passwordsMatch && (
              <p className="text-xs text-red-400">Passwords do not match.</p>
            )}
          </div>

          <Button
            type="submit"
            disabled={!canSubmit}
            className="h-9 w-full bg-blue-600 text-white hover:bg-blue-500 active:bg-blue-700 disabled:opacity-60"
          >
            {resetStatus === "submitting" ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Resetting…
              </>
            ) : (
              "Reset Password"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

// ── Page export — wraps inner in Suspense (required for useSearchParams) ─────

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <Card className="border-white/10 bg-white/5 text-white shadow-2xl">
          <CardContent className="flex flex-col items-center gap-4 py-10">
            <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
            <p className="text-sm text-white/50">Loading…</p>
          </CardContent>
        </Card>
      }
    >
      <ResetPasswordInner />
    </Suspense>
  );
}
