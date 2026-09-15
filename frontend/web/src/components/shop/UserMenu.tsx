"use client";

import { useState } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { LogOut, Package, User as UserIcon } from "lucide-react";

import { Avatar } from "@/components/ui/Avatar";
import type { User } from "@/types/auth";

export function UserMenu({ user }: { user: User | null }) {
  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await signOut({ redirect: false });
    } finally {
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.href = "/";
    }
  }

  if (!user) {
    return (
      <Link
        href="/login"
        className="rounded-lg bg-primary px-3.5 py-2 text-sm font-semibold text-primary-fg hover:bg-primary-hover"
      >
        Sign in
      </Link>
    );
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-full p-1 hover:bg-surface-muted"
      >
        <Avatar name={user.full_name} size={32} />
      </button>

      {open && (
        <div className="absolute right-0 z-40 mt-2 w-52 rounded-card border border-border bg-surface p-1.5 shadow-card-lg">
          <div className="truncate px-3 pb-1.5 pt-1 text-xs text-muted">{user.email}</div>
          <Link
            href="/account/profile"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-body hover:bg-surface-muted hover:text-foreground"
          >
            <UserIcon size={16} /> My profile
          </Link>
          <Link
            href="/account/orders"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-body hover:bg-surface-muted hover:text-foreground"
          >
            <Package size={16} /> My orders
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm text-danger hover:bg-danger-soft disabled:opacity-60"
          >
            <LogOut size={16} /> {loggingOut ? "Logging out…" : "Log out"}
          </button>
        </div>
      )}
    </div>
  );
}
