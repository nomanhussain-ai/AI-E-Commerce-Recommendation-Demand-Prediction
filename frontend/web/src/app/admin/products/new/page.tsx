import { PageHeader } from "@/components/admin/PageHeader";
import { ProductForm } from "@/components/admin/ProductForm";
import { auth } from "@/lib/auth";
import { categoryApi } from "@/config/api";

export const metadata = { title: "Add product" };

export default async function NewProductPage() {
  const session = await auth();
  const categories = await categoryApi.getAllCategories(session?.accessToken);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-5">
      <PageHeader title="Add product" subtitle="Create a new catalog entry" />
      <ProductForm categories={categories} />
    </div>
  );
}
