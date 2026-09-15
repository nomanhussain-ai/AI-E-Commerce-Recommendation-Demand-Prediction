"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { getSession, signIn } from "next-auth/react";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { userApi } from "@/config/api/users.api";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const result = await signIn("credentials", { email, password, redirect: false });

      if (result?.error) {
        setError("Invalid email or password.");
        return;
      }

      const session = await getSession();
      const me = session?.accessToken ? await userApi.getMe(session.accessToken) : null;

      // Full navigation (not router.push) — guarantees the destination's Server
      // Components re-render with the session NextAuth just established, instead
      // of possibly serving the pre-login page from the client router cache.
      window.location.href = me?.role === "admin" ? "/admin" : "/";
    } catch {
      setError("Could not reach the server. Is core-api running?");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="p-6">
      <h1 className="text-lg font-bold text-foreground">Welcome back</h1>
      <p className="mt-0.5 text-sm text-muted">Sign in to your ShopIQ account</p>

      <form onSubmit={onSubmit} className="mt-5 flex flex-col gap-3.5">
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
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />
        </label>

        {error && (
          <p className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">{error}</p>
        )}

        <Button type="submit" loading={loading} className="mt-1 w-full">
          Sign in
        </Button>
      </form>

      <p className="mt-5 text-center text-sm text-muted">
        <Link href="/forgot-password" className="font-semibold text-primary-hover">
          Forgot password?
        </Link>
      </p>

      <p className="mt-3 text-center text-sm text-muted">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="font-semibold text-primary-hover">
          Create one
        </Link>
      </p>
    </Card>
  );
}
