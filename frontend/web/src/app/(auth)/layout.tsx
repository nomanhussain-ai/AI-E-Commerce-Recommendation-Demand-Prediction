import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { Boxes } from "lucide-react";

import { getCurrentUser } from "@/lib/dal";

export default async function AuthLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();
  if (user) {
    redirect(user.role === "admin" ? "/admin" : "/");
  }

  return (
    <div className="grid min-h-full place-items-center bg-background px-4 py-12">
      <div className="w-full max-w-sm">
        <Link href="/" className="mb-8 flex items-center justify-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary text-primary-fg">
            <Boxes size={19} />
          </span>
          <span className="text-xl font-extrabold tracking-tight text-foreground">ShopIQ</span>
        </Link>
        {children}
      </div>
    </div>
  );
}
