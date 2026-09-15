"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Pencil, Trash2 } from "lucide-react";

import { categoryApi } from "@/config/api/categories.api";
import { ApiError } from "@/config/api/client";

export function CategoryRowActions({
  id,
  name,
  productCount,
}: {
  id: string;
  name: string;
  productCount: number;
}) {
  const router = useRouter();
  const { data: session } = useSession();
  const [busy, setBusy] = useState(false);

  async function onRename() {
    const next = prompt("Rename category", name);
    if (!next || next.trim() === "" || next === name || !session?.accessToken) return;
    setBusy(true);
    try {
      await categoryApi.updateCategory(id, { name: next.trim() }, session.accessToken);
      router.refresh();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : "Failed to rename category.");
    } finally {
      setBusy(false);
    }
  }

  async function onDelete() {
    if (productCount > 0) {
      alert(`"${name}" still has ${productCount} product(s) — move or delete them first.`);
      return;
    }
    if (!confirm(`Delete "${name}"?`) || !session?.accessToken) return;
    setBusy(true);
    try {
      await categoryApi.deleteCategory(id, session.accessToken);
      router.refresh();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : "Failed to delete category.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={onRename}
        disabled={busy}
        className="grid h-8 w-8 place-items-center rounded-lg text-muted hover:bg-surface-muted hover:text-foreground disabled:opacity-50"
        aria-label={`Rename ${name}`}
      >
        <Pencil size={15} />
      </button>
      <button
        type="button"
        onClick={onDelete}
        disabled={busy}
        className="grid h-8 w-8 place-items-center rounded-lg text-muted hover:bg-danger-soft hover:text-danger disabled:opacity-50"
        aria-label={`Delete ${name}`}
      >
        <Trash2 size={15} />
      </button>
    </div>
  );
}
