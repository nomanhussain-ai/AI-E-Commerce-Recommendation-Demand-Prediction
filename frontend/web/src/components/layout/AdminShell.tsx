"use client";

import { useState, type ReactNode } from "react";

import { cn } from "@/utils/cn";
import type { User } from "@/types/auth";

import { AdminNavbar } from "./AdminNavbar";
import { AdminSidebar } from "./AdminSidebar";

export function AdminShell({ user, children }: { user: User; children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-full">
      <AdminSidebar
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed((v) => !v)}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      <div
        className={cn(
          "flex min-h-full flex-col transition-[margin] duration-200 ease-out",
          collapsed ? "lg:ml-[68px]" : "lg:ml-[260px]",
        )}
      >
        <AdminNavbar user={user} onOpenMobileMenu={() => setMobileOpen(true)} />
        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
