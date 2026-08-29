import { Agent } from "@voltagent/core";
import { getModel } from "../config/openrouter";
import { trendCalculatorTool } from "../tools/predictionTools";

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
1. Use the trend_calculator tool to compute regression trend and moving averages.
2. Forecast daily sales for the next N days (default 7 days).
3. Determine whether demand is increasing, stable, or decreasing.
4. Calculate recommended reorder threshold and safety stock.
5. Return a strict JSON response format:
   {
     "predictions": [
       { "day": 1, "predicted_quantity": <number> }, ...
     ],
     "total_predicted_demand": <number>,
     "trend": "increasing" | "stable" | "decreasing",
     "reorder_recommendation": "<concise advice string>"
   }
6. Output ONLY valid JSON without markdown fences.
`,
  model: getModel(),
  tools: [trendCalculatorTool],
  maxSteps: 3
});
