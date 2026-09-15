"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { categoryApi } from "@/config/api/categories.api";
import { ApiError } from "@/config/api/client";

export function CategoryFormBar() {
  const router = useRouter();
  const { data: session } = useSession();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim() || !session?.accessToken) return;
    setLoading(true);
    setError(null);

    try {
      await categoryApi.createCategory({ name: name.trim() }, session.accessToken);
      setName("");
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to create category.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex items-center gap-2.5 border-b border-border p-4">
      <Input
        placeholder="New category name…"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="max-w-xs"
      />
      <Button type="submit" loading={loading}>
        <Plus size={16} /> Add category
      </Button>
      {error && <span className="text-sm text-danger">{error}</span>}
    </form>
  );
}
