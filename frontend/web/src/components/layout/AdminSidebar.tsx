"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Boxes, ChevronLeft, ChevronRight, PanelLeftClose, PanelLeftOpen, X } from "lucide-react";

import { ADMIN_NAV } from "@/utils/constants/nav";
import { cn } from "@/utils/cn";

function isActive(pathname: string, href: string) {
  return href === "/admin" ? pathname === href : pathname.startsWith(href);
}

export function AdminSidebar({
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onCloseMobile,
}: {
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}) {
  const pathname = usePathname();

  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={onCloseMobile}
          aria-hidden
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col border-r border-border bg-surface",
          "transition-[width,transform] duration-200 ease-out",
          collapsed ? "w-[68px]" : "w-[260px]",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
      >
        <div className="relative flex h-16 shrink-0 items-center justify-between px-4">
          <Link
            href="/admin"
            className={cn("flex items-center gap-2.5 overflow-hidden", !collapsed && "lg:pr-6")}
          >
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary text-primary-fg">
              <Boxes size={18} />
            </span>
            {!collapsed && (
              <span className="truncate text-lg font-extrabold tracking-tight text-foreground">
                ShopIQ
              </span>
            )}
          </Link>

          <button
            type="button"
            onClick={onToggleCollapse}
            aria-label={collapsed ? "Expand menu" : "Collapse menu"}
            className={cn(
              "absolute top-1/2 hidden h-6 w-6 -translate-y-1/2 place-items-center rounded-full",
              "border border-border bg-surface text-muted shadow-card hover:text-foreground lg:grid",
              collapsed ? "-right-3" : "right-4",
            )}
          >
            {collapsed ? <ChevronRight size={13} /> : <ChevronLeft size={13} />}
          </button>

          <button
            type="button"
            onClick={onCloseMobile}
            className="rounded-md p-1 text-muted hover:bg-surface-muted lg:hidden"
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 pb-4">
          {ADMIN_NAV.map((section) => (
            <div key={section.title} className="mb-4">
              {!collapsed && (
                <div className="px-3 pb-1.5 pt-3 font-mono text-[0.65rem] font-semibold uppercase tracking-widest text-muted">
                  {section.title}
                </div>
              )}
              <ul className="flex flex-col gap-0.5">
                {section.items.map((item) => {
                  const active = isActive(pathname, item.href);
                  const Icon = item.icon;
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        title={collapsed ? item.label : undefined}
                        className={cn(
                          "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                          active
                            ? "bg-primary text-primary-fg shadow-card"
                            : "text-body hover:bg-surface-muted hover:text-foreground",
                        )}
                      >
                        <Icon
                          size={18}
                          className={cn(
                            "shrink-0",
                            active ? "text-primary-fg" : "text-muted group-hover:text-foreground",
                          )}
                        />
                        {!collapsed && <span className="truncate">{item.label}</span>}
                        {!collapsed && item.badge && (
                          <span
                            className={cn(
                              "ml-auto rounded-full px-1.5 py-0.5 font-mono text-[0.6rem] font-bold",
                              active
                                ? "bg-white/20 text-primary-fg"
                                : "bg-primary-soft text-primary-hover",
                            )}
                          >
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        <button
          type="button"
          onClick={onToggleCollapse}
          className="hidden shrink-0 items-center gap-2 border-t border-border px-4 py-3 text-xs font-medium text-muted hover:bg-surface-muted hover:text-foreground lg:flex"
        >
          {collapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
          {!collapsed && "Collapse menu"}
        </button>
      </aside>
    </>
  );
}
