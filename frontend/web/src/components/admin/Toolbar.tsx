import { Search } from "lucide-react";
import type { ReactNode } from "react";

import { Input } from "@/components/ui/Input";

export function Toolbar({
  searchPlaceholder,
  filters,
  actions,
}: {
  searchPlaceholder?: string;
  filters?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2.5 border-b border-border p-4">
      {searchPlaceholder && (
        <label className="relative flex min-w-[220px] flex-1 items-center">
          <Search size={15} className="pointer-events-none absolute left-3 text-muted" />
          <Input placeholder={searchPlaceholder} className="pl-9" />
        </label>
      )}
      {filters && <div className="flex flex-wrap items-center gap-2">{filters}</div>}
      {actions && <div className="ml-auto flex items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Select({
  options,
  ...props
}: {
  options: { label: string; value: string }[];
} & React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
      {...props}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
