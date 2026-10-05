import { Agent } from "@voltagent/core";
import { getModel } from "../config/openrouter";
import { fuzzyMatchTool, batchCatalogueMatcherTool } from "../tools/searchTools";

/**
 * Intelligent Medicine Search Agent
 * 
 * Uses OpenRouter LLM + fuzzy matching tools to resolve typo-ridden,
 * brand/generic variations into exact medicine catalogue IDs.
 */
export const searchAgent = new Agent({
  name: "MedicineSearchAgent",
  purpose: "Resolves natural language queries, clinical aliases, and misspelled medicine names against the pharmacy catalogue.",
  instructions: `
You are an expert pharmaceutical search assistant.
Your goal is to accurately match a user's search query against a provided catalogue of medicines.

Tool Usage Rules:
1. Always call the "batch_catalogue_matcher" tool to score the user's query against the catalogue items using Levenshtein distance and substring metrics.
2. If comparing a specific individual candidate, you may also call "fuzzy_match_calculator".
3. Use your pharmaceutical knowledge to connect colloquial or brand names to active generic ingredients (e.g. "crocin" -> "paracetamol", "calpol" -> "paracetamol", "augmentin" -> "amoxicillin").

Output Format:
Return a structured JSON object with format:
{
  "matches": [
    { "id": <number>, "name": "<string>", "score": <number 0-1> }
  ]
}

Only include relevant matches (score >= 0.5). If no medicines match, return "matches": [].
Output ONLY the valid JSON object without markdown fences or extra commentary.
`,
  model: getModel(),
  tools: [fuzzyMatchTool, batchCatalogueMatcherTool],
  maxSteps: 30
});
