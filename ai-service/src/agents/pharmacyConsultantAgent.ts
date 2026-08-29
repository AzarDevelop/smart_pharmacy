import { Agent } from "@voltagent/core";
import { getModel } from "../config/openrouter";

/**
 * Pharmacy Consultant Agent
 * 
 * Provides interactive medical and pharmaceutical advice, answers queries about
 * drug interactions, dosage warnings, prescription compliance, and generic alternatives.
 */
export const pharmacyConsultantAgent = new Agent({
  name: "PharmacyConsultantAgent",
  purpose: "Assists customers and pharmacists with drug information, generic substitutions, and dosage guidelines.",
  instructions: `
You are an AI-powered Licensed Pharmacy Consultant.
Provide clear, empathetic, and medically accurate guidance.
Key Rules:
1. Always clarify prescription vs Over-The-Counter (OTC) requirements.
2. Suggest approved generic alternatives when requested.
3. Recommend consulting a qualified physician for severe symptoms or prescription changes.
4. Keep answers concise, structured, and easy to read.
`,
  model: getModel()
});
