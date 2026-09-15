"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { authApi } from "@/config/api/auth.api";
import { ApiError } from "@/config/api/client";

export function RegisterForm() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Register directly against FastAPI first — surfaces the backend's real
      // validation message (weak password, duplicate email, …). Then establish
      // the NextAuth session by signing in with the same credentials.
      await authApi.register({ email, password, full_name: fullName });
      await signIn("credentials", { email, password, redirect: false });

      // Full navigation — see LoginForm for why this isn't router.push().
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.href = "/verify-email";
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not reach the server. Is core-api running?");
      setLoading(false);
    }
  }

  return (
    <Card className="p-6">
      <h1 className="text-lg font-bold text-foreground">Create your account</h1>
      <p className="mt-0.5 text-sm text-muted">Start shopping with AI-powered picks</p>

      <form onSubmit={onSubmit} className="mt-5 flex flex-col gap-3.5">
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium text-body">Full name</span>
          <Input
            required
            autoComplete="name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Ayesha Raza"
          />
        </label>

        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium text-body">Email</span>
          <Input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
        </label>

        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium text-body">Password</span>
          <Input
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 8 characters"
          />
        </label>

        {error && (
          <p className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">{error}</p>
        )}

        <Button type="submit" loading={loading} className="mt-1 w-full">
          Create account
        </Button>
      </form>

      <p className="mt-5 text-center text-sm text-muted">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-primary-hover">
          Sign in
        </Link>
      </p>
    </Card>
  );
}
