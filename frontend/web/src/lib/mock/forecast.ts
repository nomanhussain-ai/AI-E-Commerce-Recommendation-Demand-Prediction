export const forecastSeries = [
  { date: "Sep 01", actual: 11, yhat: 10.2, lower: 7.8, upper: 12.6 },
  { date: "Sep 03", actual: 13, yhat: 12.1, lower: 9.4, upper: 14.8 },
  { date: "Sep 05", actual: 9, yhat: 11.4, lower: 8.6, upper: 14.2 },
  { date: "Sep 07", actual: 14, yhat: 13.0, lower: 10.1, upper: 15.9 },
  { date: "Sep 09", actual: null, yhat: 14.2, lower: 10.8, upper: 17.6 },
  { date: "Sep 11", actual: null, yhat: 15.6, lower: 11.5, upper: 19.7 },
  { date: "Sep 13", actual: null, yhat: 16.8, lower: 12.0, upper: 21.6 },
  { date: "Sep 15", actual: null, yhat: 17.5, lower: 12.1, upper: 22.9 },
];

export const forecastAccuracy = [
  { model: "Naive (last week)", mae: 4.8, rmse: 6.2, mape: 34.1, wape: 29.0 },
  { model: "Moving average (7d)", mae: 4.1, rmse: 5.4, mape: 28.6, wape: 24.3 },
  { model: "SARIMA / Prophet", mae: 3.2, rmse: 4.3, mape: 21.9, wape: 18.7 },
  { model: "LightGBM (proposed)", mae: 2.6, rmse: 3.5, mape: 18.4, wape: 15.2 },
];

export const riskDistribution = [
  { risk: "HIGH", count: 24, color: "var(--danger)" },
  { risk: "MEDIUM", count: 58, color: "var(--warning)" },
  { risk: "LOW", count: 312, color: "var(--success)" },
];
