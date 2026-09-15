import { env } from "@/config/env";
import type { ApiErrorBody } from "@/types/common";

export class ApiError extends Error {
  status: number;
  code: string;
  details: Record<string, unknown>;

  constructor(status: number, body: Partial<ApiErrorBody["error"]>) {
    super(body.message ?? "Request failed");
    this.name = "ApiError";
    this.status = status;
    this.code = body.code ?? "UNKNOWN_ERROR";
    this.details = body.details ?? {};
  }
}

type FetchOptions = Omit<RequestInit, "body"> & { body?: unknown };

/**
 * Runs in both Server Components (Node) and Client Components (browser) —
 * it must never import anything server-only (`next/headers`, `next-auth`'s
 * `auth()`, etc.), that's what keeps every `config/api/*.api.ts` file safe
 * to import from a "use client" component. `process.env.CORE_API_URL`
 * (non-public) is only ever read on the server; Next.js replaces it with
 * `undefined` in the browser bundle, so the public var is used there.
 */
function resolveBaseUrl(): string {
  return typeof window === "undefined" ? env.CORE_API_URL : env.PUBLIC_CORE_API_URL;
}

/**
 * The one place that knows how to call the FastAPI backend. Every
 * `config/api/*.api.ts` module wraps this — nothing else should import it
 * directly. Pass `token` (a FastAPI access token) to attach it as a bearer
 * header; omit it for public endpoints or anonymous calls.
 */
export async function coreFetch<T>(
  path: string,
  opts: FetchOptions = {},
  token?: string,
): Promise<T> {
  const { body, headers, ...rest } = opts;

  const res = await fetch(`${resolveBaseUrl()}${path}`, {
    ...rest,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });

  if (res.status === 204) return undefined as T;

  const json = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new ApiError(res.status, json.error ?? { message: `HTTP ${res.status}` });
  }

  return json as T;
}

export async function coreUpload<T>(path: string, formData: FormData, token?: string): Promise<T> {
  const res = await fetch(`${resolveBaseUrl()}${path}`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: formData,
    cache: "no-store",
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ApiError(res.status, json.error ?? { message: `HTTP ${res.status}` });
  }
  return json as T;
}
