"use client";

import { useState } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { Boxes, ChevronDown, LogOut, User as UserIcon } from "lucide-react";

import { Avatar } from "@/components/ui/Avatar";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import type { User } from "@/types/auth";

export function AccountHeader({ user }: { user: User }) {
  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await signOut({ redirect: false });
    } finally {
      // Full navigation — client Router Cache would otherwise serve the
      // pre-logout page (see the LoginForm fix for the same issue).
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.href = "/login";
    }
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-surface/80 px-4 backdrop-blur-md sm:px-6">
      <Link href="/" className="flex items-center gap-2.5">
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-fg">
          <Boxes size={18} />
        </span>
        <span className="text-lg font-extrabold tracking-tight text-foreground">ShopIQ</span>
      </Link>

      <div className="ml-auto flex items-center gap-1.5">
        <ThemeToggle />

        <div className="relative">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="flex items-center gap-2 rounded-full py-1 pl-1 pr-2 hover:bg-surface-muted"
          >
            <Avatar name={user.full_name} imageUrl={user.avatar_url} size={32} status="online" />
            <span className="hidden text-left sm:block">
              <span className="block max-w-[9rem] truncate text-sm font-medium leading-tight text-foreground">
                {user.full_name}
              </span>
            </span>
            <ChevronDown size={14} className="hidden text-muted sm:block" />
          </button>

          {open && (
            <div className="absolute right-0 mt-2 w-64 rounded-card border border-border bg-surface p-1.5 shadow-card-lg">
              <div className="flex items-center gap-3 px-3 py-3">
                <Avatar name={user.full_name} imageUrl={user.avatar_url} size={40} status="online" />
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-foreground">
                    {user.full_name}
                  </div>
                  <div className="truncate text-xs capitalize text-muted">{user.role}</div>
                </div>
              </div>
              <div className="mb-1 border-t border-border" />
              <div className="truncate px-3 pb-1.5 pt-1 text-xs text-muted">{user.email}</div>
              <Link
                href="/account/profile"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-body hover:bg-surface-muted hover:text-foreground"
              >
                <UserIcon size={16} /> My profile
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
      </div>
    </header>
  );
}
