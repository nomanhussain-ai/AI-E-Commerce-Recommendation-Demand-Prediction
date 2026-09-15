import type { ReactNode } from "react";

import { AccountHeader } from "@/components/account/AccountHeader";
import { AccountSidebar } from "@/components/account/AccountSidebar";
import { requireUser } from "@/lib/dal";

export default async function AccountLayout({ children }: { children: ReactNode }) {
  const user = await requireUser();

  return (
    <div className="min-h-full">
      <AccountHeader user={user} />
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-5 p-4 sm:p-6 lg:flex-row lg:items-start">
        <AccountSidebar />
        <div className="min-w-0 flex-1">{children}</div>
      </main>
    </div>
  );
}
