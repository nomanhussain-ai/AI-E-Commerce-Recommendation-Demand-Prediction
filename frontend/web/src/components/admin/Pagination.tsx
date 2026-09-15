"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/utils/cn";

export function Pagination({
  page,
  totalPages,
  total,
  pageSize,
}: {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  function hrefFor(p: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(p));
    return `${pathname}?${params.toString()}`;
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border p-4 text-sm">
      <span className="text-muted">
        Showing <span className="font-medium text-foreground">{from}</span>â€“
        <span className="font-medium text-foreground">{to}</span> of{" "}
        <span className="font-medium text-foreground">{total}</span>
      </span>
      <div className="flex items-center gap-1">
        <Link
          href={hrefFor(Math.max(1, page - 1))}
          aria-disabled={page <= 1}
          className={cn(
            "grid h-8 w-8 place-items-center rounded-lg border border-border text-body hover:bg-surface-muted",
            page <= 1 && "pointer-events-none opacity-40",
          )}
        >
          <ChevronLeft size={15} />
        </Link>
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
          <Link
            key={p}
            href={hrefFor(p)}
            className={
              p === page
                ? "grid h-8 w-8 place-items-center rounded-lg bg-primary text-sm font-semibold text-primary-fg"
                : "grid h-8 w-8 place-items-center rounded-lg text-sm text-body hover:bg-surface-muted"
            }
          >
            {p}
          </Link>
        ))}
        <Link
          href={hrefFor(Math.min(totalPages, page + 1))}
          aria-disabled={page >= totalPages}
          className={cn(
            "grid h-8 w-8 place-items-center rounded-lg border border-border text-body hover:bg-surface-muted",
            page >= totalPages && "pointer-events-none opacity-40",
          )}
        >
          <ChevronRight size={15} />
        </Link>
      </div>
    </div>
  );
}
