import { Hono } from "hono";
import { searchAgent } from "../agents/searchAgent";
import { demandPredictionAgent } from "../agents/demandPredictionAgent";
import { pharmacyConsultantAgent } from "../agents/pharmacyConsultantAgent";
import { openrouterApiKey } from "../config/openrouter";

export const compatApp = new Hono();

// Health check endpoint
compatApp.get("/", (c) => {
  return c.json({
    status: "VoltAgent AI service is running.",
    framework: "VoltAgent (TypeScript)",
    provider: "OpenRouter",
    agents: ["MedicineSearchAgent", "DemandPredictionAgent", "PharmacyConsultantAgent"]
  });
});

// Fallback fuzzy search when offline/no API key is set
function localFuzzySearch(query: string, catalogue: any[]) {
  const q = query.toLowerCase().trim();
  return catalogue
    .map((item) => {
      const name = (item.name || "").toLowerCase();
      const generic = (item.generic_name || "").toLowerCase();
      let score = 0;
      if (name === q || generic === q) score = 1.0;
      else if (name.includes(q) || generic.includes(q)) score = 0.85;
      else if (q.includes(name) || (generic && q.includes(generic))) score = 0.75;
      else {
        // Character overlap check
        const overlap = q.split("").filter((ch) => name.includes(ch)).length;
        score = overlap / Math.max(q.length, name.length);
      }
      return { id: item.id, name: item.name, score: Math.round(score * 100) / 100 };
    })
    .filter((m) => m.score >= 0.4)
    .sort((a, b) => b.score - a.score);
}

// POST /nlp-search
// Consumed by backend medicineController
compatApp.post("/nlp-search", async (c) => {
  try {
    const body = await c.req.json();
    const { query, catalogue } = body;

    if (!query || typeof query !== "string" || !query.trim()) {
      return c.json({ message: "query is required" }, 400);
    }

    if (!catalogue || !Array.isArray(catalogue) || catalogue.length === 0) {
      return c.json({ query, matches: [] });
    }

    // If no valid OpenRouter key is set or starts with placeholder, use fast local fuzzy fallback
    if (!openrouterApiKey || openrouterApiKey.includes("your-openrouter-api-key")) {
      const fallbackMatches = localFuzzySearch(query, catalogue);
      return c.json({ query, matches: fallbackMatches });
    }

    // Call VoltAgent searchAgent
    const prompt = `Query: "${query}"\nCatalogue: ${JSON.stringify(catalogue)}`;
    const result = await searchAgent.generateText(prompt);

    try {
      // Clean JSON output in case of markdown wrapping
      const cleaned = result.text.replace(/```json/g, "").replace(/```/g, "").trim();
      const parsed = JSON.parse(cleaned);
      return c.json({ query, matches: parsed.matches || [] });
    } catch {
      // Fallback to local matcher if LLM output parsing fails
      const matches = localFuzzySearch(query, catalogue);
      return c.json({ query, matches });
    }
  } catch (err: any) {
    console.error("Error in /nlp-search:", err);
    return c.json({ message: "Internal AI service error", error: err?.message }, 500);
  }
});

// POST /predict-demand
// Consumed by backend pharmacyController
compatApp.post("/predict-demand", async (c) => {
  try {
    const body = await c.req.json();
    const { history, days_ahead } = body;

    if (!history || !Array.isArray(history) || history.length === 0) {
      return c.json({ message: "history is required" }, 400);
    }

    const days = days_ahead || 7;

    // Fallback mathematical model if OpenRouter key is not yet configured
    if (!openrouterApiKey || openrouterApiKey.includes("your-openrouter-api-key")) {
      const quantities = history.map((h: any) => Number(h.quantity) || 0);
      const avg = Math.round(quantities.reduce((a, b) => a + b, 0) / quantities.length);
      const predictions = Array.from({ length: days }, (_, i) => ({
        day: i + 1,
        predicted_quantity: Math.max(1, avg)
      }));
      return c.json({
        predictions,
        total_predicted_demand: avg * days,
        trend: "stable",
        reorder_recommendation: `Recommended order threshold: ${avg * 2} units.`
      });
    }

    // Call VoltAgent demandPredictionAgent
    const prompt = `Sales history: ${JSON.stringify(history)}. Predict demand for the next ${days} days.`;
    const result = await demandPredictionAgent.generateText(prompt);

    try {
      const cleaned = result.text.replace(/```json/g, "").replace(/```/g, "").trim();
      const parsed = JSON.parse(cleaned);
      return c.json(parsed);
    } catch {
      const quantities = history.map((h: any) => Number(h.quantity) || 0);
      const avg = Math.round(quantities.reduce((a, b) => a + b, 0) / quantities.length);
      return c.json({
        predictions: Array.from({ length: days }, (_, i) => ({ day: i + 1, predicted_quantity: avg })),
        total_predicted_demand: avg * days,
        trend: "stable"
      });
    }
  } catch (err: any) {
    console.error("Error in /predict-demand:", err);
    return c.json({ message: "Internal AI service error", error: err?.message }, 500);
  }
});

// POST /consult
// Direct consultation & medicine recommendation endpoint
compatApp.post("/consult", async (c) => {
  try {
    const { question, catalogue } = await c.req.json();
    if (!question) return c.json({ message: "question is required" }, 400);

    let prompt = question;
    if (catalogue && Array.isArray(catalogue) && catalogue.length > 0) {
      prompt = `User health inquiry: "${question}"\n\nAvailable Pharmacy Catalogue:\n${JSON.stringify(catalogue.map((m: any) => ({ name: m.name, generic: m.generic_name, category: m.category, prescription: m.requires_prescription })))}\n\nPlease advise the patient medically and mention any specific medicines from this catalogue if appropriate. Remind them if a prescription is required.`;
    }

    const result = await pharmacyConsultantAgent.generateText(prompt);
    return c.json({ answer: result.text });
  } catch (err: any) {
    console.error("Error in /consult:", err);
    return c.json({ error: err.message }, 500);
  }
});

