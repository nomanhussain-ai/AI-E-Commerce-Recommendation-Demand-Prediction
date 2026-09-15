export const searchOverview = {
  totalSearches: { value: 18_402, deltaPct: 11.2 },
  zeroResultRate: { value: 6.8, deltaPct: -1.4 },
  avgLatencyMs: { value: 14, deltaPct: -8.1 },
  ctr: { value: 21.3, deltaPct: 2.6 },
};

export const engineSplit = [
  { engine: "meili", label: "Meilisearch (keyword)", pct: 78, color: "var(--primary)" },
  { engine: "hybrid", label: "Meilisearch (hybrid)", pct: 16, color: "var(--info)" },
  { engine: "pg-fts", label: "Postgres FTS (fallback)", pct: 6, color: "var(--warning)" },
];

export const topQueries = [
  { query: "gaming laptop", searches: 1_842, zeroResult: false, ctr: 22.4 },
  { query: "wireless earbuds under 5000", searches: 1_205, zeroResult: false, ctr: 18.1 },
  { query: "study table", searches: 968, zeroResult: false, ctr: 14.6 },
  { query: "smart watch women", searches: 588, zeroResult: false, ctr: 19.8 },
  { query: "office chair", searches: 511, zeroResult: false, ctr: 16.2 },
  { query: "bluetooth speaker", searches: 476, zeroResult: false, ctr: 20.5 },
];

export const zeroResultQueries = [
  { query: "iphone 15 case pk", searches: 742 },
  { query: "ramzan bundle offer", searches: 611 },
  { query: "eid collection kids", searches: 388 },
  { query: "graphics card rtx 4090", searches: 244 },
  { query: "washing machine 12kg", searches: 201 },
];
