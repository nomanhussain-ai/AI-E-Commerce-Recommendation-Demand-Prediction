import { CartItemsList } from "@/components/shop/CartItemsList";
import { StorefrontHeader } from "@/components/shop/StorefrontHeader";
import { getAccessToken } from "@/lib/auth";
import { requireUser } from "@/lib/dal";
import { cartApi } from "@/config/api";

export const metadata = { title: "Your cart" };

export default async function CartPage() {
  await requireUser();
  const cart = await cartApi.getCart(await getAccessToken());

  return (
    <div className="min-h-full">
      <StorefrontHeader />
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <h1 className="mb-5 text-xl font-bold text-foreground">Your cart</h1>
        <CartItemsList initial={cart} />
      </main>
    </div>
  );
}
