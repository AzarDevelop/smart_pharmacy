import { createTool } from "@voltagent/core";
import { z } from "zod";

function computeLevenshteinScore(s1: string, s2: string): number {
  const str1 = s1.toLowerCase().trim();
  const str2 = s2.toLowerCase().trim();

  if (str1 === str2) return 1.0;
  if (str2.includes(str1) || str1.includes(str2)) return 0.9;

  const track = Array(str2.length + 1).fill(null).map(() =>
    Array(str1.length + 1).fill(null)
  );

  for (let i = 0; i <= str1.length; i += 1) track[0][i] = i;
  for (let j = 0; j <= str2.length; j += 1) track[j][0] = j;

  for (let j = 1; j <= str2.length; j += 1) {
    for (let i = 1; i <= str1.length; i += 1) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
      track[j][i] = Math.min(
        track[j][i - 1] + 1,
        track[j - 1][i] + 1,
        track[j - 1][i - 1] + indicator
      );
    }
  }

  const distance = track[str2.length][str1.length];
  const maxLen = Math.max(str1.length, str2.length);
  return Math.max(0, (maxLen - distance) / maxLen);
}

/**
 * Single candidate fuzzy matching tool
 */
export const fuzzyMatchTool = createTool({
  name: "fuzzy_match_calculator",
  description: "Calculates similarity score (0 to 1) between a user search query and a single candidate medicine or generic name.",
  parameters: z.object({
    searchTerm: z.string().describe("User query or misspelled medicine name"),
    candidateName: z.string().describe("Catalogue medicine name or generic composition")
  }),
  execute: async ({ searchTerm, candidateName }) => {
    const score = computeLevenshteinScore(searchTerm, candidateName);
    return {
      searchTerm,
      candidateName,
      score: Math.round(score * 100) / 100,
      exact: score === 1.0,
      confidence: score >= 0.8 ? "high" : score >= 0.5 ? "medium" : "low"
    };
  }
});

/**
 * Batch catalogue similarity ranking tool
 */
export const batchCatalogueMatcherTool = createTool({
  name: "batch_catalogue_matcher",
  description: "Ranks an entire catalogue of medicines against a search query using Levenshtein distance and substring metrics.",
  parameters: z.object({
    query: z.string().describe("User search query, typo or colloquial name"),
    catalogue: z.array(z.object({
      id: z.number().describe("Catalogue medicine ID"),
      name: z.string().describe("Brand or trade name"),
      generic_name: z.string().optional().describe("Generic molecule name")
    })).describe("Catalogue medicines array to score")
  }),
  execute: async ({ query, catalogue }) => {
    const scored = catalogue.map((item) => {
      const nameScore = computeLevenshteinScore(query, item.name);
      const genericScore = item.generic_name ? computeLevenshteinScore(query, item.generic_name) : 0;
      const bestScore = Math.max(nameScore, genericScore);

      return {
        id: item.id,
        name: item.name,
        generic_name: item.generic_name,
        score: Math.round(bestScore * 100) / 100
      };
    });

    // Sort descending by score
    scored.sort((a, b) => b.score - a.score);

    // Return matches with score >= 0.4
    const matches = scored.filter((s) => s.score >= 0.4);

    return {
      query,
      total_candidates: catalogue.length,
      matched_count: matches.length,
      matches
    };
  }
});
