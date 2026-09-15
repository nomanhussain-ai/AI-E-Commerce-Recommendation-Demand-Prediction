export const modelRegistry = [
  { kind: "Recommender", version: "v1.4", strategy: "Hybrid (CF + content + popularity)", trainedAt: "2026-09-08 00:12", isActive: true, metric: "P@10 0.312" },
  { kind: "Recommender", version: "v1.3", strategy: "Hybrid (CF + content + popularity)", trainedAt: "2026-08-25 00:10", isActive: false, metric: "P@10 0.299" },
  { kind: "Forecaster", version: "v0.9", strategy: "LightGBM global model", trainedAt: "2026-09-07 02:00", isActive: true, metric: "MAPE 18.4%" },
  { kind: "Embedder", version: "v1.0", strategy: "all-MiniLM-L6-v2", trainedAt: "2026-08-01 00:00", isActive: true, metric: "384-d" },
];

export const recoEval = [
  { model: "Popularity (baseline)", p10: 0.184, r10: 0.121, ndcg10: 0.201, coverage: 0.42 },
  { model: "Content-based", p10: 0.238, r10: 0.163, ndcg10: 0.257, coverage: 0.61 },
  { model: "Collaborative (ALS)", p10: 0.271, r10: 0.189, ndcg10: 0.289, coverage: 0.55 },
  { model: "Hybrid (proposed)", p10: 0.312, r10: 0.224, ndcg10: 0.334, coverage: 0.68 },
];

export const recoReasonBreakdown = [
  { reason: "Collaborative filtering", pct: 38, color: "var(--primary)" },
  { reason: "Content similarity", pct: 27, color: "var(--info)" },
  { reason: "Category affinity", pct: 19, color: "var(--success)" },
  { reason: "Popularity / trending", pct: 16, color: "var(--warning)" },
];

export const ctrTrend = [
  { date: "Mon", ctr: 12.1 },
  { date: "Tue", ctr: 12.8 },
  { date: "Wed", ctr: 13.4 },
  { date: "Thu", ctr: 13.1 },
  { date: "Fri", ctr: 14.2 },
  { date: "Sat", ctr: 15.6 },
  { date: "Sun", ctr: 14.8 },
];
