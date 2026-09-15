import Link from "next/link";
import { Boxes, ShoppingCart } from "lucide-react";

import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { auth } from "@/lib/auth";
import { getCurrentUser } from "@/lib/dal";
import { cartApi, categoryApi } from "@/config/api";

import { SearchBox } from "./SearchBox";
import { UserMenu } from "./UserMenu";

export async function StorefrontHeader() {
  const session = await auth();
  const [categories, cart, user] = await Promise.all([
    categoryApi.getAllCategories(session?.accessToken),
    cartApi.getCart(session?.accessToken),
    getCurrentUser(),
  ]);
  const topLevel = categories.filter((c) => !c.parent_id && c.is_active).slice(0, 6);

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-surface/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6">
        <Link href="/" className="flex shrink-0 items-center gap-2.5">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-fg">
            <Boxes size={18} />
          </span>
          <span className="hidden text-lg font-extrabold tracking-tight text-foreground sm:block">
            ShopIQ
          </span>
        </Link>

        <SearchBox />

        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />

          <Link
            href="/cart"
            className="relative grid h-9 w-9 place-items-center rounded-full text-body hover:bg-surface-muted"
            aria-label="Cart"
          >
            <ShoppingCart size={19} />
            {cart.item_count > 0 && (
              <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[0.6rem] font-bold text-primary-fg">
                {cart.item_count}
              </span>
            )}
          </Link>

          <UserMenu user={user} />
        </div>
      </div>

      {topLevel.length > 0 && (
        <nav className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4 pb-2 sm:px-6">
          {topLevel.map((c) => (
            <Link
              key={c.id}
              href={`/?category_id=${c.id}`}
              className="shrink-0 rounded-full px-3 py-1 text-xs font-medium text-body hover:bg-surface-muted hover:text-foreground"
            >
              {c.name}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
