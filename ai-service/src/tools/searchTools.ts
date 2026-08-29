import { createTool } from "@voltagent/core";
import { z } from "zod";

// Helper tool for fuzzy match scoring calculation
export const fuzzyMatchTool = createTool({
  name: "fuzzy_match_calculator",
  description: "Calculates similarity score between a user search term and medicine catalogue names.",
  parameters: z.object({
    searchTerm: z.string().describe("User query"),
    candidateName: z.string().describe("Catalogue medicine name or generic name")
  }),
  execute: async ({ searchTerm, candidateName }) => {
    const s1 = searchTerm.toLowerCase().trim();
    const s2 = candidateName.toLowerCase().trim();
    
    if (s1 === s2) return { score: 1.0, exact: true };
    if (s2.includes(s1) || s1.includes(s2)) return { score: 0.9, contains: true };

    // Levenshtein distance calculation
    const track = Array(s2.length + 1).fill(null).map(() =>
      Array(s1.length + 1).fill(null));
    for (let i = 0; i <= s1.length; i += 1) {
      track[0][i] = i;
    }
    for (let j = 0; j <= s2.length; j += 1) {
      track[j][0] = j;
    }
    for (let j = 1; j <= s2.length; j += 1) {
      for (let i = 1; i <= s1.length; i += 1) {
        const indicator = s1[i - 1] === s2[j - 1] ? 0 : 1;
        track[j][i] = Math.min(
          track[j][i - 1] + 1,
          track[j - 1][i] + 1,
          track[j - 1][i - 1] + indicator
        );
      }
    }
    const distance = track[s2.length][s1.length];
    const maxLen = Math.max(s1.length, s2.length);
    const score = Math.max(0, (maxLen - distance) / maxLen);

    return { score, distance };
  }
});
