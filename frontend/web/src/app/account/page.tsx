import Link from "next/link";
import { Heart, MapPin, Package, Sparkles } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { requireUser } from "@/lib/dal";

export const metadata = { title: "My account" };

const FEATURES: {
  title: string;
  description: string;
  icon: LucideIcon;
  href: string | null;
}[] = [
  { title: "My orders", description: "Track and review past purchases", icon: Package, href: "/account/orders" },
  { title: "Wishlist", description: "Products you've saved for later", icon: Heart, href: null },
  { title: "Addresses", description: "Manage saved shipping addresses", icon: MapPin, href: null },
  { title: "Recommended for you", description: "Personalized picks (M1)", icon: Sparkles, href: null },
];

export default async function AccountPage() {
  const user = await requireUser();

  return (
    <div className="flex flex-col gap-5">
      <Card className="flex flex-col items-start gap-4 p-6 sm:flex-row sm:items-center">
        <Avatar name={user.full_name} size={56} className="text-lg" />
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-bold text-foreground">Welcome, {user.full_name}</h1>
          <p className="mt-0.5 text-sm text-muted">{user.email}</p>
        </div>
        <Badge tone="primary" className="capitalize">
          {user.role}
        </Badge>
      </Card>

      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">
          Your account
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {FEATURES.map(({ title, description, icon: Icon, href }) => {
            const content = (
              <>
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary-soft text-primary-hover">
                  <Icon size={18} />
                </span>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-foreground">{title}</span>
                    {!href && <Badge tone="neutral">Coming soon</Badge>}
                  </div>
                  <p className="mt-0.5 text-sm text-muted">{description}</p>
                </div>
              </>
            );

            return href ? (
              <Link key={title} href={href}>
                <Card className="flex items-start gap-3 p-4 transition-colors hover:border-primary">
                  {content}
                </Card>
              </Link>
            ) : (
              <Card key={title} className="flex items-start gap-3 p-4 opacity-70 shadow-none" aria-disabled>
                {content}
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
