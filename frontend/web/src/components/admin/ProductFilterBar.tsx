"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Plus, Search } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import type { Category } from "@/types/categories";

export function ProductFilterBar({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [q, setQ] = useState(searchParams.get("q") ?? "");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const setParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) params.set(key, value);
      else params.delete(key);
      params.delete("page");
      router.push(`${pathname}?${params.toString()}`);
    },
    [pathname, router, searchParams],
  );

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setParam("q", q), 350);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  return (
    <div className="flex flex-wrap items-center gap-2.5 border-b border-border p-4">
      <label className="relative flex min-w-[220px] flex-1 items-center">
        <Search size={15} className="pointer-events-none absolute left-3 text-muted" />
        <Input
          placeholder="Search by name, SKU or brand…"
          className="pl-9"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </label>

      <select
        className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
        value={searchParams.get("category_id") ?? ""}
        onChange={(e) => setParam("category_id", e.target.value)}
      >
        <option value="">All categories</option>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>

      <select
        className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
        value={searchParams.get("is_active") ?? ""}
        onChange={(e) => setParam("is_active", e.target.value)}
      >
        <option value="">All status</option>
        <option value="true">Active</option>
        <option value="false">Inactive</option>
      </select>

      <select
        className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
        value={searchParams.get("sort") ?? "-created"}
        onChange={(e) => setParam("sort", e.target.value)}
      >
        <option value="-created">Newest</option>
        <option value="title">Name A–Z</option>
        <option value="price">Price: low to high</option>
        <option value="-price">Price: high to low</option>
        <option value="stock">Stock: low to high</option>
      </select>

      <Link href="/admin/products/new" className="ml-auto">
        <Button>
          <Plus size={16} /> Add product
        </Button>
      </Link>
    </div>
  );
}
