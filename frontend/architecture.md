# Frontend Architecture — Target Structure & Rules

Status: **proposal / working spec** for restructuring `frontend/web`. Nothing in this
document has been applied to the codebase yet — this is the prompt to implement
against. Backend (`ecommerce_fastapi_backend`) is a separate, dedicated service;
this doc governs the Next.js app only. No database or GitHub actions are implied
by anything here.

---

## 1. Non-negotiable rules

1. **No scattered `fetch()` calls.** Every call to the backend goes through a
   named function on a per-module API object exported from `src/config/api/`.
   Pages, components, and hooks import the object, never build a URL by hand.
2. **`src/config/api/`** holds the API layer: one file per backend module, each
   exporting a single object of named methods (`productApi.getAllProducts()`,
   `productApi.getProductById(id)`, ...). See §3.
3. **`src/types/`** holds all TypeScript types, one dedicated file per domain,
   named `<domain>.d.ts` (e.g. `products.d.ts`, `orders.d.ts`). See §4.
4. **No hand-written Next.js Route Handlers, period.** We have a dedicated
   FastAPI backend (`backend/`) — the frontend never re-implements
   `/api/products`, `/api/orders`, `/api/auth/login`, etc. as proxy routes
   with our own logic in them. Session/auth is handled by **NextAuth (Auth.js)
   with a JWT strategy**, not custom cookie routes — see §6. The single file
   NextAuth itself requires under `app/api/auth/[...nextauth]/route.ts` is
   library wiring (one line, no business logic), not an exception to this
   rule so much as the one file we don't author ourselves. Every other
   `app/api/**` route currently in the repo is a violation to remove.
5. **Public-side routing never uses a parenthesized group whose name just
   restates the segment.** Concretely: `app/(admin)/admin/...` is banned —
   it must be `app/admin/...`. Route groups `(name)` are reserved for the one
   case they exist for: applying a distinct layout to routes that must **not**
   gain a URL segment. If the folder name already appears in the URL (like
   `admin`), wrapping it in a group adds nothing but confusion.
6. **`src/utils/`** holds pure utility functions and constant files. If a file
   exports functions with no side effects beyond formatting/computing a value,
   it belongs here. If a file exports `UPPER_SNAKE` or `PascalCase` constant
   values/config arrays (nav items, enums, option lists), it belongs here too,
   under `src/utils/constants/`.
7. **`src/lib/`** is reserved for framework-glue code that doesn't fit the
   three buckets above — server-only session/cookie plumbing, auth guards
   (DAL), the `env` config. Keep it small; if something can move to `config`,
   `types`, or `utils`, move it.

---

## 2. Target folder tree

```
frontend/web/src/
├── app/
│   ├── admin/                     # flattened — was (admin)/admin
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── products/
│   │   ├── categories/
│   │   ├── inventory/
│   │   ├── orders/
│   │   ├── customers/
│   │   ├── analytics/
│   │   ├── ml/
│   │   ├── forecast/
│   │   ├── search/
│   │   └── settings/
│   ├── login/
│   ├── register/
│   ├── verify-email/
│   ├── forgot-password/
│   ├── reset-password/
│   ├── account/
│   ├── cart/
│   ├── checkout/
│   ├── p/[slug]/                  # storefront product detail
│   ├── page.tsx                   # storefront home
│   └── api/
│       └── auth/[...nextauth]/
│           └── route.ts           # NextAuth's own handler — 2 lines, no logic of ours
├── config/
│   ├── api/
│   │   ├── client.ts              # shared fetch wrapper, ApiError, base URL
│   │   ├── auth.api.ts            # register/verify-email/otp/forgot/reset — plain calls, no cookies
│   │   ├── products.api.ts
│   │   ├── categories.api.ts
│   │   ├── inventory.api.ts
│   │   ├── orders.api.ts
│   │   ├── cart.api.ts
│   │   ├── customers.api.ts
│   │   ├── users.api.ts
│   │   ├── analytics.api.ts
│   │   ├── ml.api.ts
│   │   ├── forecast.api.ts
│   │   ├── search.api.ts
│   │   ├── notifications.api.ts
│   │   └── index.ts               # barrel: re-export every *Api object
│   └── env.ts                     # moved from lib/env.ts (it's config)
├── types/
│   ├── common.d.ts                # Paginated<T>, ApiErrorBody, shared enums
│   ├── auth.d.ts                  # User, UserRole, TokenPair, AccessPair
│   ├── products.d.ts
│   ├── categories.d.ts
│   ├── inventory.d.ts
│   ├── orders.d.ts
│   ├── cart.d.ts
│   ├── customers.d.ts
│   ├── analytics.d.ts
│   ├── ml.d.ts
│   ├── forecast.d.ts
│   ├── search.d.ts
│   └── notifications.d.ts
├── utils/
│   ├── constants/
│   │   ├── nav.ts                 # moved from lib/nav-config.ts (ADMIN_NAV)
│   │   ├── order-status.ts        # OrderStatus option lists/labels
│   │   └── roles.ts               # role constants/labels
│   ├── format.ts                  # moved from lib/format.ts
│   ├── cn.ts                      # moved from lib/utils.ts
│   └── search-params.ts           # toSearchParams() helper (was in lib/catalog.ts)
├── lib/
│   ├── auth.ts                    # NextAuth config: Credentials provider + JWT callbacks
│   └── dal.ts                     # requireUser()/requireAdmin() — thin wrappers over auth()
└── components/
    ├── ui/
    ├── admin/
    ├── storefront/
    └── layout/
```

---

## 3. API config pattern (`src/config/api/`)

### `client.ts` — the one place that knows how to talk to the backend

```ts
// src/config/api/client.ts
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

/** Base call — no auth. Pass a bearer token via `opts.headers` if the call needs one. */
export async function coreFetch<T>(path: string, opts: FetchOptions = {}): Promise<T> {
  // implementation stays as today's src/lib/api.ts::coreFetch — moved, not rewritten
}

/** Server Components / Server Actions — pulls the token from the NextAuth session via auth(). */
export async function apiFetch<T>(path: string, opts: FetchOptions = {}): Promise<T> {
  const session = await auth(); // from "@/lib/auth"
  return coreFetch<T>(path, {
    ...opts,
    headers: { ...(session?.accessToken ? { Authorization: `Bearer ${session.accessToken}` } : {}), ...opts.headers },
  });
}
```

Server code (RSC, Server Actions) uses `apiFetch`. Client Components call
`coreFetch` directly with the bearer header built from `useSession()`'s
`accessToken` (see §6) — either way, only `*.api.ts` files import `client.ts`;
nothing else touches `coreFetch`/`apiFetch` directly.

### One object per module, named methods only

```ts
// src/config/api/products.api.ts
import { apiFetch } from "./client";
import { toSearchParams } from "@/utils/search-params";
import type { Product, ProductQuery, CreateProductInput, UpdateProductInput } from "@/types/products";
import type { Paginated } from "@/types/common";

export const productApi = {
  getAllProducts: (query: ProductQuery = {}) =>
    apiFetch<Paginated<Product>>(`/products${toSearchParams(query)}`),

  getProductById: (id: string) => apiFetch<Product>(`/products/${id}`),

  createProduct: (payload: CreateProductInput) =>
    apiFetch<Product>("/admin/products", { method: "POST", body: payload }),

  updateProduct: (id: string, payload: UpdateProductInput) =>
    apiFetch<Product>(`/admin/products/${id}`, { method: "PUT", body: payload }),

  deleteProduct: (id: string) => apiFetch<void>(`/admin/products/${id}`, { method: "DELETE" }),
};
```

```ts
// src/config/api/index.ts
export { productApi } from "./products.api";
export { categoryApi } from "./categories.api";
export { orderApi } from "./orders.api";
export { cartApi } from "./cart.api";
export { customerApi } from "./customers.api";
export { authApi } from "./auth.api";
export { userApi } from "./users.api";
export { inventoryApi } from "./inventory.api";
export { analyticsApi } from "./analytics.api";
export { mlApi } from "./ml.api";
export { forecastApi } from "./forecast.api";
export { searchApi } from "./search.api";
export { notificationApi } from "./notifications.api";
```

Call sites:

```ts
import { productApi } from "@/config/api";

const { data, meta } = await productApi.getAllProducts({ page, q });
```

Never `import { apiFetch } from "@/config/api/client"` from a page/component —
that would defeat the point of the object layer. Only `*.api.ts` files import
`client.ts`.

---

## 4. Types pattern (`src/types/`)

One file per domain, named exactly after the domain, `.d.ts` suffix. All
request/response/query shapes for that domain live in the same file next to
the entity type, so the matching `*.api.ts` only needs one import.

```ts
// src/types/products.d.ts
export type Product = {
  id: string;
  sku: string;
  slug: string;
  title: string;
  description: string;
  category_id: string;
  category_name: string | null;
  brand: string | null;
  price: number;
  discount_price: number | null;
  currency: string;
  image_url: string | null;
  stock: number;
  rating_avg: number;
  rating_count: number;
  is_active: boolean;
};

export type ProductQuery = {
  q?: string;
  category_id?: string;
  brand?: string;
  is_active?: boolean;
  min_price?: number;
  max_price?: number;
  low_stock?: boolean;
  sort?: string;
  page?: number;
  page_size?: number;
};

export type CreateProductInput = Omit<Product, "id" | "category_name" | "rating_avg" | "rating_count">;
export type UpdateProductInput = Partial<CreateProductInput>;
```

`common.d.ts` holds only genuinely cross-domain shapes: `Paginated<T>`,
`ApiErrorBody`. Don't let it become a dumping ground — if a type is specific
to one domain, it goes in that domain's file even if it's small.

Current `src/types/index.ts` is a single file mixing auth, catalog, orders,
cart, and customers — split it along these lines:

| Type in current `types/index.ts`                          | New file             |
|-------------------------------------------------------------|-----------------------|
| `UserRole`, `User`, `TokenPair`, `AccessPair`               | `types/auth.d.ts`     |
| `ApiErrorBody`, `Paginated<T>`                               | `types/common.d.ts`   |
| `Category`                                                    | `types/categories.d.ts` |
| `Product`                                                      | `types/products.d.ts` |
| `OrderStatus`, `OrderItem`, `Order`                           | `types/orders.d.ts`   |
| `CartItem`, `Cart`                                             | `types/cart.d.ts`     |
| `CustomerSegment`, `Customer`                                 | `types/customers.d.ts` |

---

## 5. Utils pattern (`src/utils/`)

Split by what a file *is*, not what feature it supports:

- **Pure functions** (no constants, no JSX, no fetch) → `utils/<name>.ts`.
  Examples already in the repo: `formatCurrency`/`formatCompactNumber`/
  `formatPercent` (`lib/format.ts`), `cn()` (`lib/utils.ts`), `toSearchParams()`
  (currently buried inside `lib/catalog.ts`).
- **Constant data/config** → `utils/constants/<name>.ts`. Examples: `ADMIN_NAV`
  (currently `lib/nav-config.ts` — it's a constant array, not a component or a
  fetch helper, so it belongs here, not in `lib/`), order-status label maps,
  role labels.
- A component-specific constant (e.g. a dropdown's fixed option list used by
  exactly one component) can stay colocated with that component. Only promote
  it to `utils/constants/` once a second file needs it.

---

## 6. Auth: NextAuth (Auth.js) with a JWT strategy — no hand-written cookie routes

Previous draft of this doc had us hand-writing `app/api/auth/{login,register,
logout,refresh}/route.ts` to manage `httpOnly` cookies ourselves. **Rejected**
— that's exactly the kind of Next.js-side API logic we're banning, and it's
reinventing what NextAuth already does correctly. Replaced with:

- **`next-auth`, `Credentials` provider, `session: { strategy: "jwt" }`.** No
  database adapter — sessions are a signed/encrypted JWT in NextAuth's own
  cookie, not something we manage by hand. Minimal config, not a new
  subsystem.
- **`src/lib/auth.ts`** — the entire NextAuth config:
  - `Credentials.authorize(credentials)` calls `authApi.login(credentials)`
    (the existing `config/api/auth.api.ts`, unchanged) against FastAPI and
    returns `{ user, access_token, refresh_token, expires_at }` on success,
    `null` on failure.
  - `callbacks.jwt({ token, user })` — on first sign-in, copies
    `access_token`/`refresh_token`/`expires_at`/`role` onto `token`. On
    subsequent calls, if `access_token` is expired, calls
    `authApi.refresh(token.refresh_token)` and updates `token` — this is
    where the old `/api/auth/refresh` route's job goes.
  - `callbacks.session({ session, token })` — exposes `session.user.role` and
    `session.accessToken` to the app (see the tradeoff note below).
  - `events.signOut` — best-effort call to `authApi.logout(...)` to revoke
    the refresh token server-side before NextAuth clears its own cookie.
- **`app/api/auth/[...nextauth]/route.ts`** — the framework-mandated file:
  ```ts
  import { handlers } from "@/lib/auth";
  export const { GET, POST } = handlers;
  ```
  This is the only file under `app/api/` in the whole app, and it has no
  logic of ours in it.
- **Reading the session:**
  - Server (RSC, Server Actions, `lib/dal.ts`): `auth()` from `lib/auth.ts`.
    `requireUser()`/`requireAdmin()` in `lib/dal.ts` become thin wrappers over
    `auth()` doing the same redirect-if-missing/redirect-if-wrong-role job
    they do today — just without touching cookies directly.
  - Client Components: NextAuth's `useSession()` / `signIn()` / `signOut()`
    from `next-auth/react`, wrapped in a `<SessionProvider>` in the root
    layout.
- **Non-session auth actions stay plain API calls, no route needed:**
  `register`, `send-otp`, `verify-email`, `forgot-password`, `reset-password`
  don't establish a session, so they're just `authApi.register()`,
  `authApi.sendOtp()`, etc. called directly from a Server Action or a client
  handler — same pattern as every other domain, no special-casing.

**Tradeoff, stated on purpose:** exposing `session.accessToken` in the
`session` callback makes the FastAPI bearer token readable by client JS
(NextAuth's own session cookie stays `httpOnly`, but the JSON it hands back
via `useSession()` does not). That's what lets Client Components call FastAPI
directly with `Authorization: Bearer <token>` instead of needing a Next.js
proxy — accepted here in exchange for not hand-rolling cookie/CORS plumbing,
per "minimal config, not over-engineering." Rotate/short-expire the access
token (already 15 min per `[[rmo-fyp-build]]`) so the exposure window stays
small; the refresh token itself is never sent to the client, only used
server-side in the `jwt` callback.

This also resolves what used to be an open question about the admin CRUD
proxy routes: a Client Component doing `productApi.updateProduct(...)` can
now attach `session.accessToken` and call FastAPI directly — no
`app/api/admin/products` proxy needed. FastAPI needs CORS enabled for the
frontend origin to accept these direct browser calls (bearer-token auth, so
no `credentials: "include"`/cookie-domain complexity).

Full route-to-replacement table:

| Route to delete                                      | Replace with                                      |
|--------------------------------------------------------|-----------------------------------------------------|
| `api/auth/login`, `register`, `logout`, `refresh`      | NextAuth (`signIn`/`signOut`/`jwt` callback) — see above |
| `api/auth/send-otp`, `api/auth/verify-email`           | `authApi.sendOtp()`, `authApi.verifyEmail()`         |
| `api/auth/forgot-password`, `api/auth/reset-password`  | `authApi.forgotPassword()`, `authApi.resetPassword()` |
| `api/admin/products`, `api/admin/products/[id]`        | `productApi.*` (admin methods), called with `session.accessToken` from the client, or `auth()`-derived token server-side |
| `api/admin/categories`, `api/admin/categories/[id]`    | `categoryApi.*`                                      |
| `api/admin/orders`, `api/admin/orders/[id]`            | `orderApi.*`                                         |
| `api/admin/customers`                                   | `customerApi.getAll()`                               |
| `api/users/me`                                           | `userApi.getMe()` / `userApi.updateMe()`             |
| `api/cart`, `api/cart/items`, `api/cart/items/[id]`    | `cartApi.*`                                           |
| `api/orders`                                              | `orderApi.placeOrder()`, `orderApi.getMyOrders()`    |

---

## 7. Migration checklist (folders/files only, no logic rewrites)

1. `app/(admin)/admin/**` → `app/admin/**` (drop the group folder).
2. Decide whether `app/(auth)/**` gets the same treatment (`login`,
   `register`, etc. don't repeat "auth" in their own name, so the group may be
   legitimate here — it changes layout only, doesn't restate a segment. Keep
   unless the user says otherwise).
3. `lib/api.ts` → split into `config/api/client.ts` (the `coreFetch`/`ApiError`
   plumbing) + per-domain files that import it.
4. `lib/catalog.ts` → `config/api/products.api.ts` + `config/api/categories.api.ts`;
   its local `toSearchParams()` → `utils/search-params.ts`.
5. `lib/env.ts` → `config/env.ts`.
6. `lib/nav-config.ts` → `utils/constants/nav.ts`.
7. `lib/format.ts` → `utils/format.ts`.
8. `lib/utils.ts` (`cn()`) → `utils/cn.ts`.
9. Install `next-auth`; add `lib/auth.ts` (Credentials provider + JWT
   callbacks, per §6) and `app/api/auth/[...nextauth]/route.ts`. Delete
   `lib/session.ts` entirely (NextAuth owns its own cookie). Rewrite
   `lib/dal.ts`'s `getCurrentUser`/`requireUser`/`requireAdmin` on top of
   `auth()` instead of manually reading the `access_token` cookie.
10. `types/index.ts` → split per §4's table.
11. `lib/mock/*.ts` → delete file-by-file only once the matching `*.api.ts`
    module is wired to the real backend and every caller of the mock is
    switched over. Do not delete a mock ahead of its real replacement being in
    place (analytics/ml/forecast/search are still mock-only per current
    project state — leave those mocks in place until backed by real
    endpoints).
12. Delete every `app/api/**` route per the table in §6 (login/register/
    logout/refresh replaced by NextAuth itself, not just moved), one module
    at a time. Update `LoginForm.tsx`/`RegisterForm.tsx` and any admin table
    that currently does `fetch("/api/admin/...")` to use `signIn()`/
    `productApi.*`/etc. with `session.accessToken` instead. Confirm FastAPI
    CORS is enabled for the frontend origin before wiring direct
    client-to-backend calls.

This document intentionally stops at the structure and the rules — no code
was moved as part of writing it. Implement §7 as a separate, reviewable
change (ideally one commit per numbered step, so a broken import is easy to
bisect).
