"use client";

import { useState, type KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { Bell, ChevronDown, LogOut, Menu, Search, Settings, User as UserIcon } from "lucide-react";

import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { IconButton } from "@/components/ui/IconButton";
import { cn } from "@/utils/cn";
import type { User } from "@/types/auth";

import { ThemeToggle } from "./ThemeToggle";

const NOTIFICATIONS = [
  { title: "Stock alert", detail: "ASUS TUF F15 coverage dropped to LOW", time: "12m ago", tone: "danger" as const },
  { title: "New order", detail: "Order #ORD-8841 placed — Rs 42,500", time: "38m ago", tone: "success" as const },
  { title: "Model retrained", detail: "Recommender v1.4 activated", time: "2h ago", tone: "primary" as const },
];

export function AdminNavbar({
  user,
  onOpenMobileMenu,
}: {
  user: User;
  onOpenMobileMenu: () => void;
}) {
  const router = useRouter();
  const [notifOpen, setNotifOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [query, setQuery] = useState("");

  function onSearchKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && query.trim()) {
      router.push(`/admin/products?q=${encodeURIComponent(query.trim())}`);
    }
  }

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await signOut({ redirect: false });
    } finally {
      // Full navigation — see LoginForm for why this isn't router.push().
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.href = "/login";
    }
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-surface/80 px-4 backdrop-blur-md sm:px-6">
      <button
        type="button"
        onClick={onOpenMobileMenu}
        className="rounded-md p-2 text-body hover:bg-surface-muted lg:hidden"
        aria-label="Open menu"
      >
        <Menu size={20} />
      </button>

      <label className="relative hidden max-w-sm flex-1 items-center sm:flex">
        <Search size={16} className="pointer-events-none absolute left-3 text-muted" />
        <input
          type="search"
          placeholder="Search products… (press Enter)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={onSearchKeyDown}
          className="w-full rounded-lg border border-border bg-surface-alt py-2 pl-9 pr-3 text-sm text-foreground outline-none placeholder:text-muted focus:border-primary"
        />
      </label>

      <div className="ml-auto flex items-center gap-1.5">
        <ThemeToggle />

        <div className="relative">
          <IconButton
            aria-label="Notifications"
            onClick={() => {
              setNotifOpen((v) => !v);
              setUserOpen(false);
            }}
            className="relative"
          >
            <Bell size={18} />
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-danger" />
          </IconButton>

          {notifOpen && (
            <div className="absolute right-0 mt-2 w-80 rounded-card border border-border bg-surface p-2 shadow-card-lg">
              <div className="flex items-center justify-between px-2 py-1.5">
                <span className="text-sm font-semibold text-foreground">Notifications</span>
                <Badge tone="primary">{NOTIFICATIONS.length} new</Badge>
              </div>
              <div className="flex flex-col">
                {NOTIFICATIONS.map((n) => (
                  <div
                    key={n.title}
                    className="flex items-start gap-2.5 rounded-lg px-2 py-2 hover:bg-surface-muted"
                  >
                    <span
                      className={cn(
                        "mt-1.5 h-2 w-2 shrink-0 rounded-full",
                        n.tone === "danger" && "bg-danger",
                        n.tone === "success" && "bg-success",
                        n.tone === "primary" && "bg-primary",
                      )}
                    />
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium text-foreground">{n.title}</div>
                      <div className="truncate text-xs text-muted">{n.detail}</div>
                    </div>
                    <span className="ml-auto shrink-0 text-[0.65rem] text-muted">{n.time}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setUserOpen((v) => !v);
              setNotifOpen(false);
            }}
            className="flex items-center gap-2 rounded-full py-1 pl-1 pr-2 hover:bg-surface-muted"
          >
            <Avatar name={user.full_name} size={32} status="online" />
            <span className="hidden text-left sm:block">
              <span className="block max-w-[9rem] truncate text-sm font-medium leading-tight text-foreground">
                {user.full_name}
              </span>
              <span className="block text-[0.7rem] capitalize leading-tight text-muted">
                {user.role}
              </span>
            </span>
            <ChevronDown size={14} className="hidden text-muted sm:block" />
          </button>

          {userOpen && (
            <div className="absolute right-0 mt-2 w-64 rounded-card border border-border bg-surface p-1.5 shadow-card-lg">
              <div className="flex items-center gap-3 px-3 py-3">
                <Avatar name={user.full_name} size={40} status="online" />
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-foreground">
                    {user.full_name}
                  </div>
                  <div className="truncate text-xs capitalize text-muted">{user.role}</div>
                </div>
              </div>
              <div className="mb-1 border-t border-border" />
              <div className="truncate px-3 pb-1.5 pt-1 text-xs text-muted">{user.email}</div>
              <a
                href="/admin/profile"
                className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-body hover:bg-surface-muted hover:text-foreground"
              >
                <UserIcon size={16} /> My profile
              </a>
              <a
                href="/admin/settings"
                className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-body hover:bg-surface-muted hover:text-foreground"
              >
                <Settings size={16} /> Settings
              </a>
              <div className="my-1 border-t border-border" />
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
