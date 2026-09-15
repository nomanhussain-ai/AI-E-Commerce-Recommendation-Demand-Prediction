"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useSession } from "next-auth/react";
import { MailCheck } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { authApi } from "@/config/api/auth.api";
import { ApiError } from "@/config/api/client";

const RESEND_COOLDOWN_SECONDS = 30;

export function VerifyEmailForm({ email }: { email: string }) {
  const { data: session } = useSession();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [sending, setSending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const sentOnMount = useRef(false);

  async function sendOtp() {
    if (!session?.accessToken) return;
    setSending(true);
    setError(null);
    try {
      const data = await authApi.sendOtp(session.accessToken);
      setInfo(
        data.debug_otp
          ? `Code sent — dev mode: ${data.debug_otp}` // core-api only includes this when DEBUG=true
          : `A 6-digit code was sent to ${email}.`,
      );
      setCooldown(RESEND_COOLDOWN_SECONDS);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not reach the server.");
    } finally {
      setSending(false);
    }
  }

  useEffect(() => {
    if (sentOnMount.current || !session?.accessToken) return;
    sentOnMount.current = true;
    void sendOtp();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.accessToken]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!session?.accessToken) return;
    setError(null);
    setVerifying(true);

    try {
      const user = await authApi.verifyEmail(code, session.accessToken);
      // Full navigation — see LoginForm for why this isn't router.push().
      window.location.href = user.role === "admin" ? "/admin" : "/";
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not reach the server.");
    } finally {
      setVerifying(false);
    }
  }

  return (
    <Card className="p-6">
      <div className="mb-1 flex items-center gap-2 text-primary">
        <MailCheck size={20} />
        <h1 className="text-lg font-bold text-foreground">Verify your email</h1>
      </div>
      <p className="text-sm text-muted">
        Enter the 6-digit code we sent to <span className="font-medium text-body">{email}</span>.
      </p>

      <form onSubmit={onSubmit} className="mt-5 flex flex-col gap-3.5">
        <Input
          required
          inputMode="numeric"
          pattern="\d{6}"
          maxLength={6}
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
          placeholder="000000"
          className="text-center text-lg tracking-[0.5em]"
        />

        {error && (
          <p className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">{error}</p>
        )}
        {info && !error && (
          <p className="rounded-lg bg-success-soft px-3 py-2 text-sm text-success">{info}</p>
        )}

        <Button type="submit" loading={verifying} disabled={code.length !== 6} className="w-full">
          Verify
        </Button>

        <button
          type="button"
          onClick={sendOtp}
          disabled={sending || cooldown > 0}
          className="text-center text-sm font-medium text-primary-hover disabled:cursor-not-allowed disabled:text-muted"
        >
          {cooldown > 0 ? `Resend code in ${cooldown}s` : "Resend code"}
        </button>
      </form>
    </Card>
  );
}
