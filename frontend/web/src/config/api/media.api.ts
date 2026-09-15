import { coreUpload } from "./client";

export type MediaUpload = { key: string; url: string };

export const mediaApi = {
  upload: (file: File, folder: "products" | "profiles", token: string) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", folder);
    return coreUpload<MediaUpload>("/media/upload", formData, token);
  },
};