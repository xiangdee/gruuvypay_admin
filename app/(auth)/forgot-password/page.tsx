"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { ArrowLeft, Loader2, Mail } from "lucide-react";

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

type Step = 1 | 2;

const RESEND_COOLDOWN = 60;

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<Step>(1);
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Resend cooldown
  const [resendCountdown, setResendCountdown] = useState(0);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, []);

  function startCooldown() {
    setResendCountdown(RESEND_COOLDOWN);
    countdownRef.current = setInterval(() => {
      setResendCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownRef.current!);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }

  async function sendResetLink() {
    setIsLoading(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/auth/forgot-password`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        }
      );

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(
          (data as { message?: string }).message ?? "Failed to send reset link. Please try again."
        );
        return;
      }

      setStep(2);
      startCooldown();
    } catch {
      toast.error("Network error. Please check your connection and try again.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    await sendResetLink();
  }

  async function handleResend() {
    if (resendCountdown > 0) return;
    await sendResetLink();
  }

  // ── Step 1: Email form ──────────────────────────────────────────────────────
  if (step === 1) {
    return (
      <Card className="border-white/10 bg-white/5 text-white shadow-2xl">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold text-white">
            Forgot password?
          </CardTitle>
          <CardDescription className="text-sm text-white/50">
            Enter your email and we'll send you a reset link.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email" className="text-white/80">
                Email address
              </Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="admin@gruuvypay.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
                className="border-white/10 bg-white/5 text-white placeholder:text-white/30 focus-visible:border-blue-500 focus-visible:ring-blue-500/20"
              />
            </div>

            <Button
              type="submit"
              disabled={isLoading || !email}
              className="h-9 w-full bg-blue-600 text-white hover:bg-blue-500 active:bg-blue-700 disabled:opacity-60"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending…
                </>
              ) : (
                "Send Reset Link"
              )}
            </Button>

            <Link
              href="/login"
              className="flex items-center justify-center gap-1.5 text-sm text-white/50 hover:text-white/80 transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to login
            </Link>
          </form>
        </CardContent>
      </Card>
    );
  }

  // ── Step 2: Check your email ────────────────────────────────────────────────
  return (
    <Card className="border-white/10 bg-white/5 text-white shadow-2xl">
      <CardHeader className="pb-2">
        <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-blue-600/20 ring-1 ring-blue-500/30">
          <Mail className="h-5 w-5 text-blue-400" />
        </div>
        <CardTitle className="text-lg font-semibold text-white">
          Check your email
        </CardTitle>
        <CardDescription className="text-sm text-white/50">
          We sent a password reset link to{" "}
          <span className="font-medium text-white/70">{email}</span>.
        </CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        <p className="text-sm text-white/40">
          Didn't receive it? Check your spam folder or resend the email.
        </p>

        <Button
          type="button"
          onClick={handleResend}
          disabled={isLoading || resendCountdown > 0}
          className="h-9 w-full bg-blue-600 text-white hover:bg-blue-500 active:bg-blue-700 disabled:opacity-60"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sending…
            </>
          ) : resendCountdown > 0 ? (
            `Resend in ${resendCountdown}s`
          ) : (
            "Resend email"
          )}
        </Button>

        <Link
          href="/login"
          className="flex items-center justify-center gap-1.5 text-sm text-white/50 hover:text-white/80 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to login
        </Link>
      </CardContent>
    </Card>
  );
}
