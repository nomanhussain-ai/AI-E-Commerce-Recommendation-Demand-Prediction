import { PageHeader } from "@/components/admin/PageHeader";
import { ProductForm } from "@/components/admin/ProductForm";
import { auth } from "@/lib/auth";
import { categoryApi, productApi } from "@/config/api";

export const metadata = { title: "Edit product" };

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  const [categories, product] = await Promise.all([
    categoryApi.getAllCategories(session?.accessToken),
    productApi.getProductById(id, session?.accessToken),
  ]);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-5">
      <PageHeader title="Edit product" subtitle={product.title} />
      <ProductForm categories={categories} product={product} />
    </div>
  );
}
