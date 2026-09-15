"use client";

import { useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { mediaApi } from "@/config/api/media.api";
import { userApi } from "@/config/api/users.api";
import { ApiError } from "@/config/api/client";
import type { User } from "@/types/auth";

export function ProfileForm({ user }: { user: User }) {
  const router = useRouter();
  const { data: session } = useSession();
  const [fullName, setFullName] = useState(user.full_name);
  const [phone, setPhone] = useState(user.phone ?? "");
  const [address, setAddress] = useState(user.address ?? "");
  const [avatarUrl, setAvatarUrl] = useState(user.avatar_url ?? "");
  const [coverImageUrl, setCoverImageUrl] = useState(user.cover_image_url ?? "");
  const [avatarKey, setAvatarKey] = useState(user.avatar_url ?? "");
  const [coverImageKey, setCoverImageKey] = useState(user.cover_image_url ?? "");
  const [showAvatarLink, setShowAvatarLink] = useState(false);
  const [showCoverLink, setShowCoverLink] = useState(false);
  const [imageMenu, setImageMenu] = useState<"avatar" | "cover" | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState<"avatar" | "cover" | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!session?.accessToken) return;
    setError(null);
    setSaved(false);
    setLoading(true);

    try {
      await userApi.updateMe(
        {
          full_name: fullName,
          phone: phone || null,
          address: address || null,
          avatar_url: avatarKey || avatarUrl || null,
          cover_image_url: coverImageKey || coverImageUrl || null,
        },
        session.accessToken,
      );

      setSaved(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not reach the server.");
    } finally {
      setLoading(false);
    }
  }

  async function uploadImage(file: File, kind: "avatar" | "cover") {
    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file.");
      return;
    }
    if (!session?.accessToken) return;
    setError(null);
    setUploading(kind);
    try {
      const media = await mediaApi.upload(file, "profiles", session.accessToken);
      if (kind === "avatar") {
        setAvatarKey(media.key);
        setAvatarUrl(media.url);
      } else {
        setCoverImageKey(media.key);
        setCoverImageUrl(media.url);
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not upload the image.");
    } finally {
      setUploading(null);
    }
  }

  function handleImageChange(
    event: ChangeEvent<HTMLInputElement>,
    kind: "avatar" | "cover",
  ) {
    const file = event.target.files?.[0];
    if (file) void uploadImage(file, kind);
    event.target.value = "";
  }

  return (
    <form onSubmit={onSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3.5">
          <div className="relative overflow-hidden rounded-lg border border-border bg-surface-muted">
            <button
              type="button"
              aria-label="Change cover picture"
              onClick={() => setImageMenu("cover")}
              className="block h-24 w-full cursor-pointer bg-primary-soft text-left"
            >
              {coverImageUrl && (
                // eslint-disable-next-line @next/next/no-img-element -- user-provided S3 image URL
                <img src={coverImageUrl} alt="" className="h-full w-full object-cover" />
              )}
            </button>
            <button
              type="button"
              aria-label="Change profile picture"
              onClick={() => setImageMenu("avatar")}
              className="-mt-8 ml-4 block cursor-pointer rounded-full text-left"
            >
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element -- user-provided S3 image URL
                <img src={avatarUrl} alt="Profile" className="h-16 w-16 rounded-full border-4 border-surface object-cover" />
              ) : (
                <div className="grid h-16 w-16 place-items-center rounded-full border-4 border-surface bg-primary text-xl font-bold text-primary-fg">
                  {fullName.slice(0, 1).toUpperCase()}
                </div>
              )}
            </button>
            {imageMenu && (
              <div className="absolute right-3 top-3 z-10 flex flex-col gap-1 rounded-lg border border-border bg-surface p-1.5 shadow-card-lg">
                <button
                  type="button"
                  className="rounded-md px-3 py-2 text-left text-xs font-medium text-body hover:bg-surface-muted"
                  onClick={() => {
                    (imageMenu === "avatar" ? avatarInputRef : coverInputRef).current?.click();
                    setImageMenu(null);
                  }}
                >
                  Choose from device
                </button>
                <button
                  type="button"
                  className="rounded-md px-3 py-2 text-left text-xs font-medium text-body hover:bg-surface-muted"
                  onClick={() => {
                    if (imageMenu === "avatar") setShowAvatarLink(true);
                    else setShowCoverLink(true);
                    setImageMenu(null);
                  }}
                >
                  Use online image
                </button>
              </div>
            )}
          </div>

          <input
            ref={avatarInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(event) => handleImageChange(event, "avatar")}
          />
          <input
            ref={coverInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(event) => handleImageChange(event, "cover")}
          />

          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={() => avatarInputRef.current?.click()}>
              Browse profile image
            </Button>
            <Button type="button" variant="outline" onClick={() => coverInputRef.current?.click()}>
              Browse cover image
            </Button>
          </div>

          {uploading && (
            <p className="text-xs text-muted">
              Uploading {uploading === "avatar" ? "profile" : "cover"} image...
            </p>
          )}

          {showAvatarLink && (
            <Input
              value={avatarUrl.startsWith("data:") ? "" : avatarUrl}
              onChange={(event) => {
                setAvatarUrl(event.target.value);
                setAvatarKey(event.target.value);
              }}
              placeholder="Paste online profile image link"
              aria-label="Online profile image link"
            />
          )}
          {showCoverLink && (
            <Input
              value={coverImageUrl.startsWith("data:") ? "" : coverImageUrl}
              onChange={(event) => {
                setCoverImageUrl(event.target.value);
                setCoverImageKey(event.target.value);
              }}
              placeholder="Paste online cover image link"
              aria-label="Online cover image link"
            />
          )}

          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-body">Full name</span>
            <Input
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </label>

          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-body">Phone number</span>
            <Input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="03xx-xxxxxxx"
            />
          </label>

          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-body">Address</span>
            <Input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="House, street, city"
            />
          </label>

          <div className="grid grid-cols-2 gap-3 rounded-lg bg-surface-muted p-3 text-sm">
            <div><span className="text-muted">Account type</span><p className="font-medium capitalize text-foreground">{user.role}</p></div>
            <div><span className="text-muted">Admin access</span><p className="font-medium text-foreground">{user.role === "admin" ? "Yes" : "No"}</p></div>
          </div>

          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-body">Email</span>
            <Input value={user.email} disabled />
            <span className="text-xs text-muted">Email changes aren&apos;t supported yet.</span>
          </label>

          {error && (
            <p className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">{error}</p>
          )}

          <div className="flex items-center gap-3">
            <Button type="submit" loading={loading}>
              Save changes
            </Button>
            {saved && <span className="text-sm font-medium text-success">Saved.</span>}
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
