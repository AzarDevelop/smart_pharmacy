import { Agent } from "@voltagent/core";
import { getModel } from "../config/openrouter";
import { trendCalculatorTool, safetyStockCalculatorTool } from "../tools/predictionTools";

/**
 * Stock Demand Prediction Agent
 * 
 * Analyzes historical pharmacy sales data, uses statistical trend modeling tools,
 * and generates a 7-day demand forecast with insights.
 */
export const demandPredictionAgent = new Agent({
  name: "DemandPredictionAgent",
  purpose: "Analyzes pharmacy sales history to predict future demand and recommend restocking levels.",
  instructions: `
You are an expert pharmaceutical supply chain forecasting agent.
Given historical daily sales records:

Tool Usage Rules:
1. First, call the "trend_calculator" tool with the sales array to calculate the statistical linear trend (slope, intercept, daily average, standard deviation).
2. Second, call the "safety_stock_calculator" tool using the computed daily average and standard deviation to compute optimal safety stock and reorder point threshold.
3. Use the trend slope and average to forecast daily quantities for the next N days (default 7 days).
4. Combine the mathematical calculations with clinical seasonality insights.

Output Format:
Return a strict JSON response format:
{
  "predictions": [
    { "day": 1, "predicted_quantity": <number> }, ...
  ],
  "total_predicted_demand": <number>,
  "trend": "increasing" | "stable" | "decreasing",
  "reorder_recommendation": "<concise advice string including reorder threshold and safety stock units>"
}

Output ONLY valid JSON without markdown fences.
`,
  model: getModel(),
  tools: [trendCalculatorTool, safetyStockCalculatorTool],
  maxSteps: 30
});
