import Link from "next/link";
import { redirect } from "next/navigation";
import { Boxes } from "lucide-react";

import { VerifyEmailForm } from "@/components/auth/VerifyEmailForm";
import { requireUser } from "@/lib/dal";

export const metadata = { title: "Verify your email" };

export default async function VerifyEmailPage() {
  const user = await requireUser();

  if (user.is_email_verified) {
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
        <VerifyEmailForm email={user.email} />
      </div>
    </div>
  );
}
