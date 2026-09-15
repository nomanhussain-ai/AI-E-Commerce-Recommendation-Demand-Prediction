/**
 * Fixture data shaped exactly like the future `/admin/analytics/*` responses
 * (docs/04-api-contract.md §8.2–8.3). Swap for real `fetch()` calls once
 * core-api ships those endpoints — component props won't need to change.
 */

export const overview = {
  revenue: { value: 4_218_500, currency: "PKR", delta_pct: 18.4 },
  orders: { value: 1_284, delta_pct: 9.1 },
  aov: { value: 3_285, currency: "PKR", delta_pct: -2.3 },
  conversion_rate: { value: 3.42, delta_pct: 0.6 },
  active_users: { value: 6_920, delta_pct: 12.7 },
  reco_ctr: { value: 14.8, delta_pct: 3.1 },
};

export const salesSeries = [
  { date: "Mon", revenue: 312_000, orders: 96 },
  { date: "Tue", revenue: 298_500, orders: 88 },
  { date: "Wed", revenue: 356_200, orders: 104 },
  { date: "Thu", revenue: 341_000, orders: 99 },
  { date: "Fri", revenue: 402_800, orders: 121 },
  { date: "Sat", revenue: 468_900, orders: 146 },
  { date: "Sun", revenue: 431_100, orders: 132 },
];

export const categoryBreakdown = [
  { category: "Electronics", value: 1_845_000, color: "var(--primary)" },
  { category: "Fashion", value: 986_400, color: "var(--info)" },
  { category: "Home & Decor", value: 742_100, color: "var(--success)" },
  { category: "Sports", value: 398_700, color: "var(--warning)" },
  { category: "Other", value: 246_300, color: "var(--muted)" },
];

export const funnel = [
  { stage: "Viewed product", value: 48_210, pct: 100 },
  { stage: "Added to cart", value: 6_390, pct: 13.3 },
  { stage: "Started checkout", value: 2_940, pct: 6.1 },
  { stage: "Purchased", value: 1_284, pct: 2.7 },
];

export const stockAlerts = [
  { product: "ASUS TUF F15 Gaming Laptop", sku: "LAP-ASUS-TUF-001", risk: "HIGH" as const, coverage: 0.42, reorderQty: 38 },
  { product: "Anker Soundcore Q30", sku: "AUD-ANK-Q30-014", risk: "HIGH" as const, coverage: 0.58, reorderQty: 60 },
  { product: "Xiaomi Mi Band 8", sku: "WBL-XMI-MB8-002", risk: "MEDIUM" as const, coverage: 0.81, reorderQty: 24 },
  { product: "Nike Air Zoom Pegasus", sku: "SHO-NIK-PEG-039", risk: "MEDIUM" as const, coverage: 0.93, reorderQty: 15 },
  { product: "IKEA Study Desk 120cm", sku: "FUR-IKE-SD120-7", risk: "LOW" as const, coverage: 1.24, reorderQty: 0 },
];

export const recentOrders = [
  { id: "ORD-8841", customer: "Ayesha Raza", amount: 42_500, status: "paid" as const, time: "12 min ago" },
  { id: "ORD-8840", customer: "Bilal Ahmed", amount: 8_900, status: "pending" as const, time: "38 min ago" },
  { id: "ORD-8839", customer: "Sana Tariq", amount: 61_200, status: "shipped" as const, time: "1h ago" },
  { id: "ORD-8838", customer: "Usman Khalid", amount: 15_750, status: "paid" as const, time: "2h ago" },
  { id: "ORD-8837", customer: "Fatima Noor", amount: 3_400, status: "cancelled" as const, time: "3h ago" },
];

export const activity = [
  { title: "Model retrained", detail: "Hybrid recommender v1.4 activated — P@10 up 4.2%", time: "12 min ago", tone: "primary" as const },
  { title: "Low stock alert", detail: "ASUS TUF F15 coverage dropped to 42% of 30-day demand", time: "45 min ago", tone: "danger" as const },
  { title: "Bulk import completed", detail: "212 products updated from supplier feed", time: "2h ago", tone: "success" as const },
  { title: "Search reindex", detail: "Meilisearch products index rebuilt (18,402 docs)", time: "6h ago", tone: "info" as const },
];

export const segments = [
  { segment: "High intent", value: 1_842, color: "var(--primary)" },
  { segment: "Loyal", value: 1_120, color: "var(--success)" },
  { segment: "Window shopper", value: 2_680, color: "var(--info)" },
  { segment: "New", value: 3_012, color: "var(--warning)" },
  { segment: "At risk", value: 640, color: "var(--danger)" },
];

export const topQueries = [
  { query: "gaming laptop", searches: 1_842, zeroResult: false, ctr: 22.4 },
  { query: "wireless earbuds under 5000", searches: 1_205, zeroResult: false, ctr: 18.1 },
  { query: "study table", searches: 968, zeroResult: false, ctr: 14.6 },
  { query: "iphone 15 case pk", searches: 742, zeroResult: true, ctr: 0 },
  { query: "ramzan bundle offer", searches: 611, zeroResult: true, ctr: 0 },
  { query: "smart watch women", searches: 588, zeroResult: false, ctr: 19.8 },
];
