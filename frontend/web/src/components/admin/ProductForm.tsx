"use client";

import { useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Switch } from "@/components/ui/Switch";
import { productApi } from "@/config/api/products.api";
import { mediaApi } from "@/config/api/media.api";
import { ApiError } from "@/config/api/client";
import type { Category } from "@/types/categories";
import type { Product } from "@/types/products";

export function ProductForm({
  categories,
  product,
}: {
  categories: Category[];
  product?: Product;
}) {
  const router = useRouter();
  const { data: session } = useSession();
  const isEdit = Boolean(product);

  const [title, setTitle] = useState(product?.title ?? "");
  const [sku, setSku] = useState(product?.sku ?? "");
  const [categoryId, setCategoryId] = useState(product?.category_id ?? categories[0]?.id ?? "");
  const [brand, setBrand] = useState(product?.brand ?? "");
  const [price, setPrice] = useState(product ? String(product.price) : "");
  const [discountPrice, setDiscountPrice] = useState(
    product?.discount_price ? String(product.discount_price) : "",
  );
  const [stock, setStock] = useState(product ? String(product.stock) : "0");
  const [description, setDescription] = useState(product?.description ?? "");
  const [imageUrl, setImageUrl] = useState(product?.image_url ?? "");
  const [imageKey, setImageKey] = useState(product?.image_url ?? "");
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [isActive, setIsActive] = useState(product?.is_active ?? true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  async function onImageChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file || !session?.accessToken) return;
    setError(null);
    setUploading(true);
    try {
      const media = await mediaApi.upload(file, "products", session.accessToken);
      setImageKey(media.key);
      setImageUrl(media.url);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not upload the image.");
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!session?.accessToken) return;
    setError(null);
    setLoading(true);

    const body = {
      title,
      sku: sku || undefined,
      category_id: categoryId,
      brand: brand || undefined,
      price: Number(price),
      discount_price: discountPrice ? Number(discountPrice) : undefined,
      stock: Number(stock),
      description,
      image_url: imageKey || imageUrl || undefined,
      is_active: isActive,
    };

    try {
      if (isEdit) {
        await productApi.updateProduct(product!.id, body, session.accessToken);
      } else {
        await productApi.createProduct(body, session.accessToken);
      }

      router.push("/admin/products");
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not reach the server.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      <Card>
        <CardHeader>
          <CardTitle>Product details</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3.5">
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-body">Title</span>
            <Input required value={title} onChange={(e) => setTitle(e.target.value)} />
          </label>

          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="font-medium text-body">SKU</span>
              <Input
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                placeholder="Auto-generated if left blank"
              />
            </label>
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="font-medium text-body">Brand</span>
              <Input value={brand} onChange={(e) => setBrand(e.target.value)} />
            </label>
          </div>

          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-body">Category</span>
            <select
              required
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm text-foreground outline-none focus:border-primary"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-body">Description</span>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm text-foreground outline-none placeholder:text-muted focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </label>

          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-body">Product image</span>
            <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={onImageChange} />
            <Button type="button" variant="outline" onClick={() => imageInputRef.current?.click()} loading={uploading}>
              {uploading ? "Uploading image" : "Choose image"}
            </Button>
            <Input
              value={imageUrl}
              onChange={(e) => {
                setImageUrl(e.target.value);
                setImageKey(e.target.value);
              }}
              placeholder="Or paste an image URL"
            />
          </label>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pricing &amp; stock</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-3.5 sm:grid-cols-3">
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-body">Price (PKR)</span>
            <Input
              required
              type="number"
              min={0}
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-body">Discount price</span>
            <Input
              type="number"
              min={0}
              value={discountPrice}
              onChange={(e) => setDiscountPrice(e.target.value)}
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-body">Stock</span>
            <Input
              required
              type="number"
              min={0}
              value={stock}
              onChange={(e) => setStock(e.target.value)}
            />
          </label>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex items-center justify-between p-5">
          <div>
            <div className="text-sm font-medium text-foreground">Active</div>
            <p className="text-xs text-muted">Visible in the storefront and search</p>
          </div>
          <Switch checked={isActive} onChange={setIsActive} label="Active" />
        </CardContent>
      </Card>

      {error && <p className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">{error}</p>}

      <div className="flex items-center gap-3">
        <Button type="submit" loading={loading}>
          {isEdit ? "Save changes" : "Create product"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
