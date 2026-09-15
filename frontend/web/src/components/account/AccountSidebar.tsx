"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { House, Package, ShoppingBag, UserRound } from "lucide-react";

import { cn } from "@/utils/cn";

const NAV_ITEMS = [
  { href: "/account", label: "Account home", icon: House },
  { href: "/account/profile", label: "My profile", icon: UserRound },
  { href: "/account/orders", label: "My orders", icon: Package },
];

export function AccountSidebar() {
  const pathname = usePathname();

  return (
    <aside className="shrink-0 lg:w-56">
      <nav className="flex gap-1 overflow-x-auto rounded-xl border border-border bg-surface p-2 lg:sticky lg:top-24 lg:flex-col">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = href === "/account" ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex shrink-0 items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-primary text-primary-fg"
                  : "text-body hover:bg-surface-muted hover:text-foreground",
              )}
            >
              <Icon size={17} />
              {label}
            </Link>
          );
        })}
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-body hover:bg-surface-muted hover:text-foreground"
        >
          <ShoppingBag size={17} />
          Continue shopping
        </Link>
      </nav>
    </aside>
  );
}
