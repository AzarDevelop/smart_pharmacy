import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import dotenv from "dotenv";

dotenv.config();

export const openrouterApiKey = process.env.OPENROUTER_API_KEY || "";
export const defaultModelName = process.env.OPENROUTER_MODEL || "nvidia/nemotron-3-super-120b-a12b:free";

// Create OpenRouter provider using official OpenAI-compatible v2 provider
export const openrouter = createOpenAICompatible({
  name: "openrouter",
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: openrouterApiKey,
  headers: {
    "HTTP-Referer": "https://smart-pharmacy.app",
    "X-Title": "AI-Powered Smart Pharmacy"
  }
});

// Helper function to retrieve configured LanguageModel instance
export function getModel(modelName?: string) {
  const modelToUse = modelName || defaultModelName;
  return openrouter(modelToUse);
}


