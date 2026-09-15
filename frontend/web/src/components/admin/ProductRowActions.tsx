"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Pencil, Trash2 } from "lucide-react";
import Link from "next/link";

import { productApi } from "@/config/api/products.api";
import { ApiError } from "@/config/api/client";

export function ProductRowActions({ id, title }: { id: string; title: string }) {
  const router = useRouter();
  const { data: session } = useSession();
  const [deleting, setDeleting] = useState(false);

  async function onDelete() {
    if (!confirm(`Delete "${title}"? This can't be undone.`) || !session?.accessToken) return;
    setDeleting(true);
    try {
      await productApi.deleteProduct(id, session.accessToken);
      router.refresh();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : "Failed to delete product.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="flex items-center gap-1">
      <Link
        href={`/admin/products/${id}/edit`}
        className="grid h-8 w-8 place-items-center rounded-lg text-muted hover:bg-surface-muted hover:text-foreground"
        aria-label={`Edit ${title}`}
      >
        <Pencil size={15} />
      </Link>
      <button
        type="button"
        onClick={onDelete}
        disabled={deleting}
        className="grid h-8 w-8 place-items-center rounded-lg text-muted hover:bg-danger-soft hover:text-danger disabled:opacity-50"
        aria-label={`Delete ${title}`}
      >
        <Trash2 size={15} />
      </button>
    </div>
  );
}
