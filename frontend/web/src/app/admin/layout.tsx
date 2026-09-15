import type { ReactNode } from "react";

import { AdminShell } from "@/components/layout/AdminShell";
import { requireAdmin } from "@/lib/dal";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const user = await requireAdmin();
  return <AdminShell user={user}>{children}</AdminShell>;
}
