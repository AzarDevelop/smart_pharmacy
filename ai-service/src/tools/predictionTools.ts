import { createTool } from "@voltagent/core";
import { z } from "zod";

/**
 * 1. Trend Calculator Tool (Linear Regression & Moving Average)
 */
export const trendCalculatorTool = createTool({
  name: "trend_calculator",
  description: "Computes statistical linear regression trend (slope, intercept, average, standard deviation) over historical sales records.",
  parameters: z.object({
    sales: z.array(z.object({
      date: z.string(),
      quantity: z.number()
    })).describe("Historical sales records array")
  }),
  execute: async ({ sales }) => {
    if (!sales || sales.length === 0) {
      return { slope: 0, intercept: 0, average: 0, stdDev: 0, count: 0, trend: "stable" };
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
    const denominator = n * sumXX - sumX * sumX;
    const slope = denominator !== 0 ? (n * sumXY - sumX * sumY) / denominator : 0;
    const intercept = (sumY - slope * sumX) / n;

    // Standard deviation
    const variance = sales.reduce((acc, s) => acc + Math.pow(s.quantity - average, 2), 0) / n;
    const stdDev = Math.round(Math.sqrt(variance) * 100) / 100;

    let trend: "increasing" | "stable" | "decreasing" = "stable";
    if (slope > 0.2) trend = "increasing";
    else if (slope < -0.2) trend = "decreasing";

    return {
      slope: Math.round(slope * 100) / 100,
      intercept: Math.round(intercept * 100) / 100,
      average,
      stdDev,
      count: n,
      trend
    };
  }
});

/**
 * 2. Safety Stock & Reorder Point Calculator Tool
 */
export const safetyStockCalculatorTool = createTool({
  name: "safety_stock_calculator",
  description: "Calculates mathematically optimal safety stock and reorder point (ROP) based on lead time and demand variability.",
  parameters: z.object({
    averageDailyDemand: z.number().describe("Average units sold per day"),
    stdDev: z.number().optional().describe("Standard deviation of daily demand"),
    leadTimeDays: z.number().optional().default(3).describe("Days required for supplier to deliver stock (default 3)"),
    serviceLevelPercent: z.enum(["90", "95", "99"]).optional().default("95").describe("Desired stockout prevention service level")
  }),
  execute: async ({ averageDailyDemand, stdDev = 2, leadTimeDays = 3, serviceLevelPercent = "95" }) => {
    // Z-scores for normal distribution
    const zScores: Record<string, number> = {
      "90": 1.28,
      "95": 1.65,
      "99": 2.33
    };

    const z = zScores[serviceLevelPercent] || 1.65;
    // Safety Stock = Z * sigma * sqrt(LeadTime)
    const safetyStock = Math.ceil(z * (stdDev || 1.5) * Math.sqrt(leadTimeDays));
    // Reorder Point = (LeadTime * AvgDailyDemand) + SafetyStock
    const reorderPoint = Math.ceil((leadTimeDays * averageDailyDemand) + safetyStock);
    // Recommended restock batch (typically 7 to 14 days of supply)
    const recommendedBatchSize = Math.ceil(averageDailyDemand * 7 + safetyStock);

    return {
      lead_time_days: leadTimeDays,
      service_level: `${serviceLevelPercent}%`,
      safety_stock_units: safetyStock,
      reorder_point_threshold: reorderPoint,
      recommended_restock_batch: recommendedBatchSize,
      summary: `Place a reorder when inventory drops to ${reorderPoint} units to maintain a safety buffer of ${safetyStock} units.`
    };
  }
});
