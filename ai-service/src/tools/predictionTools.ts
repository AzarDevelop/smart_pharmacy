import { createTool } from "@voltagent/core";
import { z } from "zod";

export const trendCalculatorTool = createTool({
  name: "trend_calculator",
  description: "Computes statistical linear trend (slope, intercept, moving average) over historical sales data.",
  parameters: z.object({
    sales: z.array(z.object({
      date: z.string(),
      quantity: z.number()
    })).describe("Historical sales records")
  }),
  execute: async ({ sales }) => {
    if (sales.length === 0) {
      return { slope: 0, intercept: 0, average: 0, count: 0 };
    }

    const n = sales.length;
    let sumX = 0;
    let sumY = 0;
    let sumXY = 0;
    let sumXX = 0;

    sales.forEach((s, idx) => {
      sumX += idx;
      sumY += s.quantity;
      sumXY += idx * s.quantity;
      sumXX += idx * idx;
    });

    const average = Math.round((sumY / n) * 10) / 10;
    const denominator = (n * sumXX - sumX * sumX);
    const slope = denominator !== 0 ? (n * sumXY - sumX * sumY) / denominator : 0;
    const intercept = (sumY - slope * sumX) / n;

    return {
      slope: Math.round(slope * 100) / 100,
      intercept: Math.round(intercept * 100) / 100,
      average,
      count: n
    };
  }
});
