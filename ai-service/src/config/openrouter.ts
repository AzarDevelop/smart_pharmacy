import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import type { LanguageModel } from "ai";
import dotenv from "dotenv";

dotenv.config();

export const openrouterApiKey = process.env.OPENROUTER_API_KEY || "";
export const defaultModelName = process.env.OPENROUTER_MODEL || "openai/gpt-4o-mini";

// Create OpenRouter provider instance
export const openrouter = createOpenRouter({
  apiKey: openrouterApiKey,
  headers: {
    "HTTP-Referer": "https://smart-pharmacy.app",
    "X-Title": "AI-Powered Smart Pharmacy"
  }
});

// Helper function to retrieve configured LanguageModel instance
export function getModel(modelName?: string) {
  const modelToUse = modelName || defaultModelName;
  return openrouter(modelToUse) as unknown as LanguageModel;
}

