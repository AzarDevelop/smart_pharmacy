import { Agent } from "@voltagent/core";
import { getModel } from "../config/openrouter";
import { fuzzyMatchTool } from "../tools/searchTools";

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
Your goal is to match a user's search query against a provided catalogue of medicines.

Instructions:
1. Normalize the query (correct obvious typos, map colloquial brand names to generic names).
2. Rank the catalogue items from most relevant to least relevant.
3. Return the matched medicine items as a structured JSON object with format:
   {
     "matches": [
       { "id": <number>, "name": "<string>", "score": <number 0-1> }
     ]
   }
4. Only include relevant matches (score >= 0.5). If no medicines match, return "matches": [].
5. Output ONLY the valid JSON object without markdown fences or extra commentary.
`,
  model: getModel(),
  tools: [fuzzyMatchTool],
  maxSteps: 3
});
