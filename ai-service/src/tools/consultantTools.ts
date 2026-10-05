import { createTool } from "@voltagent/core";
import { z } from "zod";

/**
 * Common Drug-Drug Interaction Database (Deterministic Clinical Knowledge)
 */
interface DrugInteraction {
  drugs: [string, string];
  severity: "major" | "moderate" | "minor";
  description: string;
  recommendation: string;
}

const KNOWN_INTERACTIONS: DrugInteraction[] = [
  {
    drugs: ["paracetamol", "alcohol"],
    severity: "major",
    description: "Concurrent chronic alcohol intake with paracetamol enhances CYP2E1 activity, generating toxic NAPQI metabolite and dramatically increasing hepatotoxicity risk.",
    recommendation: "Avoid alcohol consumption while taking paracetamol. Keep daily paracetamol below 2000mg if alcohol history exists."
  },
  {
    drugs: ["ibuprofen", "aspirin"],
    severity: "major",
    description: "Ibuprofen competitively inhibits platelet cyclooxygenase-1, blocking the irreversible cardioprotective antiplatelet effect of low-dose aspirin and multiplying gastrointestinal bleeding risk.",
    recommendation: "Take immediate-release aspirin at least 30 minutes before ibuprofen, or take ibuprofen at least 8 hours before aspirin. Consider paracetamol as alternative."
  },
  {
    drugs: ["ibuprofen", "warfarin"],
    severity: "major",
    description: "NSAIDs cause gastric mucosal injury and inhibit platelet aggregation, greatly elevating the incidence of serious gastrointestinal hemorrhage when combined with anticoagulants.",
    recommendation: "Co-administration contraindicated unless closely monitored by hematologist. Use paracetamol for analgesia."
  },
  {
    drugs: ["amoxicillin", "methotrexate"],
    severity: "major",
    description: "Penicillins reduce renal tubular clearance of methotrexate, causing toxic systemic methotrexate accumulation (bone marrow suppression, nephrotoxicity).",
    recommendation: "Monitor methotrexate serum levels closely; consider alternative non-penicillin antibiotic."
  },
  {
    drugs: ["ciprofloxacin", "antacid"],
    severity: "moderate",
    description: "Multivalent cations (aluminum, magnesium, calcium) in antacids bind and chelate fluoroquinolones, dropping oral antibiotic absorption by up to 90%.",
    recommendation: "Administer ciprofloxacin at least 2 hours before or 6 hours after any antacids or mineral supplements."
  },
  {
    drugs: ["azithromycin", "antacid"],
    severity: "moderate",
    description: "Aluminum and magnesium-containing antacids reduce the peak serum concentration (Cmax) of azithromycin.",
    recommendation: "Separate administration times by at least 2 hours."
  },
  {
    drugs: ["metformin", "alcohol"],
    severity: "major",
    description: "Acute alcohol intoxication potentiates the effect of metformin on lactate metabolism, substantially elevating lactic acidosis risk.",
    recommendation: "Patients taking metformin must avoid excessive or binge alcohol consumption."
  },
  {
    drugs: ["cetirizine", "alcohol"],
    severity: "moderate",
    description: "Additive central nervous system depression leading to profound drowsiness, impaired motor function, and reduced alertness.",
    recommendation: "Avoid alcohol and central sedatives while taking antihistamines."
  }
];

/**
 * Common Brand to Generic Reference Mapping
 */
const BRAND_GENERIC_MAP: Record<string, { generic: string; category: string; rx: boolean; alternatives: string[] }> = {
  crocin: { generic: "Paracetamol / Acetaminophen", category: "Analgesic & Antipyretic (Pain & Fever)", rx: false, alternatives: ["Dolo 650", "Calpol", "Pacimol", "Tylenol"] },
  dolo: { generic: "Paracetamol 650mg", category: "Analgesic & Antipyretic", rx: false, alternatives: ["Crocin 650", "Calpol 650", "Pacimol 650"] },
  calpol: { generic: "Paracetamol", category: "Pediatric & Adult Antipyretic", rx: false, alternatives: ["Crocin", "Dolo", "Febrinil"] },
  augmentin: { generic: "Amoxicillin + Potassium Clavulanate", category: "Broad-Spectrum Antibiotic", rx: true, alternatives: ["Clavam 625", "Moxikind-CV", "Sensiclav"] },
  zithromax: { generic: "Azithromycin", category: "Macrolide Antibiotic", rx: true, alternatives: ["Azithral", "Azee", "Zady"] },
  azithral: { generic: "Azithromycin", category: "Macrolide Antibiotic", rx: true, alternatives: ["Azee", "Zithromax", "Azimax"] },
  glucophage: { generic: "Metformin Hydrochloride", category: "Antidiabetic (Biguanide)", rx: true, alternatives: ["Glycomet", "Obimet", "Riomet"] },
  glycomet: { generic: "Metformin", category: "Antidiabetic (Biguanide)", rx: true, alternatives: ["Glucophage", "Obimet", "Zomet"] },
  pan: { generic: "Pantoprazole", category: "Proton Pump Inhibitor (Antacid / GERD)", rx: true, alternatives: ["Pantocid", "Pantosec", "Pantodac"] },
  pantocid: { generic: "Pantoprazole", category: "Proton Pump Inhibitor", rx: true, alternatives: ["Pan 40", "Pantosec", "Protium"] },
  cetzine: { generic: "Cetirizine Hydrochloride", category: "Second-Generation Antihistamine", rx: false, alternatives: ["Zyrtec", "Alerid", "Okacet"] },
  zyrtec: { generic: "Cetirizine", category: "Antihistamine (Allergy Relief)", rx: false, alternatives: ["Cetzine", "Alerid", "Zyncet"] },
  brufen: { generic: "Ibuprofen", category: "Non-Steroidal Anti-Inflammatory Drug (NSAID)", rx: false, alternatives: ["Advil", "Motrin", "Ibugesic"] },
  advil: { generic: "Ibuprofen", category: "NSAID Analgesic", rx: false, alternatives: ["Brufen", "Motrin", "Ibugesic"] }
};

/**
 * 1. Drug Interaction Checker Tool
 */
export const drugInteractionCheckerTool = createTool({
  name: "drug_interaction_checker",
  description: "Checks known clinical drug-drug interactions and contraindications between two or more medications or substances.",
  parameters: z.object({
    medications: z.array(z.string()).min(2).describe("List of drug names or substances to evaluate for interactions (e.g. ['Ibuprofen', 'Aspirin'])")
  }),
  execute: async ({ medications }) => {
    const normalized = medications.map((m) => m.toLowerCase().trim());
    const foundInteractions: DrugInteraction[] = [];

    for (let i = 0; i < normalized.length; i++) {
      for (let j = i + 1; j < normalized.length; j++) {
        const m1 = normalized[i];
        const m2 = normalized[j];

        const match = KNOWN_INTERACTIONS.find(
          (k) =>
            (m1.includes(k.drugs[0]) && m2.includes(k.drugs[1])) ||
            (m1.includes(k.drugs[1]) && m2.includes(k.drugs[0]))
        );

        if (match) {
          foundInteractions.push(match);
        }
      }
    }

    if (foundInteractions.length === 0) {
      return {
        has_interactions: false,
        severity: "none",
        message: `No major documented contraindications detected between ${medications.join(", ")} in standard outpatient reference. Always consult a physician for multi-drug regimens.`
      };
    }

    return {
      has_interactions: true,
      count: foundInteractions.length,
      interactions: foundInteractions
    };
  }
});

/**
 * 2. Generic Alternative Finder Tool
 */
export const genericAlternativeFinderTool = createTool({
  name: "generic_alternative_finder",
  description: "Finds the active generic pharmaceutical ingredient (API), therapeutic category, and approved bioequivalent brand substitutes for a medicine.",
  parameters: z.object({
    medicineName: z.string().describe("Brand or commercial medicine name (e.g., 'Crocin', 'Augmentin', 'Calpol')")
  }),
  execute: async ({ medicineName }) => {
    const q = medicineName.toLowerCase().trim();
    const key = Object.keys(BRAND_GENERIC_MAP).find((k) => q.includes(k) || k.includes(q));

    if (key) {
      const info = BRAND_GENERIC_MAP[key];
      return {
        matched: true,
        searched_term: medicineName,
        generic_active_ingredient: info.generic,
        therapeutic_category: info.category,
        requires_prescription: info.rx,
        approved_generic_alternatives: info.alternatives,
        clinical_note: info.rx
          ? "This medication contains a prescription compound. A valid doctor's prescription is required for all equivalent generic brands."
          : "Over-The-Counter (OTC) medication. Bioequivalent generics offer identical clinical efficacy at potentially lower cost."
      };
    }

    return {
      matched: false,
      searched_term: medicineName,
      message: `No pre-cached generic substitution profile found for "${medicineName}". Please evaluate the active molecule against regional pharmaceutical formulary.`
    };
  }
});

/**
 * 3. Dosage and Precaution Advisor Tool
 */
export const dosageAndPrecautionAdvisorTool = createTool({
  name: "dosage_and_precaution_advisor",
  description: "Retrieves clinical dosage guidelines, maximum daily safety thresholds, food administration rules, and patient contraindications.",
  parameters: z.object({
    medicineName: z.string().describe("Medicine or generic molecule name (e.g. 'Paracetamol', 'Ibuprofen', 'Pantoprazole')"),
    patientCategory: z.enum(["adult", "pediatric", "geriatric", "pregnant"]).optional().describe("Patient demographic category")
  }),
  execute: async ({ medicineName, patientCategory = "adult" }) => {
    const med = medicineName.toLowerCase().trim();

    if (med.includes("paracetamol") || med.includes("acetaminophen") || med.includes("crocin") || med.includes("dolo")) {
      return {
        medicine: "Paracetamol / Acetaminophen",
        standard_adult_dose: "500mg to 650mg every 4 to 6 hours as needed.",
        max_daily_limit: "4000mg (4g) per 24 hours in healthy adults. 2000mg/day in hepatic impairment.",
        timing: "Can be taken with or without meals.",
        contraindications: ["Severe active liver disease / hepatic impairment", "Chronic severe alcoholism"],
        patient_notes: patientCategory === "pregnant"
          ? "Generally considered safest analgesic/antipyretic in pregnancy when used at lowest effective dose for shortest duration."
          : "Avoid concomitant use with other OTC cold/cough remedies containing acetaminophen to prevent accidental overdose."
      };
    }

    if (med.includes("ibuprofen") || med.includes("brufen") || med.includes("advil")) {
      return {
        medicine: "Ibuprofen (NSAID)",
        standard_adult_dose: "200mg to 400mg every 6 to 8 hours as needed.",
        max_daily_limit: "1200mg/day OTC; up to 2400mg/day under medical supervision.",
        timing: "Take immediately AFTER food or with milk to protect gastric mucosa.",
        contraindications: ["Active peptic ulcer / GI bleeding", "Severe renal impairment", "Third trimester of pregnancy"],
        patient_notes: patientCategory === "pregnant"
          ? "Contraindicated in 3rd trimester (risk of premature closure of fetal ductus arteriosus)."
          : "Do not combine with other NSAIDs (e.g. naproxen, high-dose aspirin)."
      };
    }

    if (med.includes("pantoprazole") || med.includes("pan 40") || med.includes("pantocid")) {
      return {
        medicine: "Pantoprazole (PPI)",
        standard_adult_dose: "40mg once daily.",
        max_daily_limit: "80mg/day for severe GERD / Zollinger-Ellison under physician guidance.",
        timing: "Take 30 to 60 minutes BEFORE morning breakfast with water. Swallow tablet whole; do not crush.",
        contraindications: ["Known hypersensitivity to proton pump inhibitors"],
        patient_notes: "Long-term continuous therapy (>1 year) requires monitoring for hypomagnesemia and vitamin B12 deficiency."
      };
    }

    if (med.includes("cetirizine") || med.includes("cetzine") || med.includes("zyrtec")) {
      return {
        medicine: "Cetirizine HCl",
        standard_adult_dose: "5mg to 10mg once daily in the evening.",
        max_daily_limit: "10mg per 24 hours.",
        timing: "May be taken with or without food. Evening dosing preferred due to mild drowsiness.",
        contraindications: ["Severe renal impairment (CrCl < 10 mL/min)"],
        patient_notes: "Avoid operating heavy machinery or driving until response is known."
      };
    }

    return {
      medicine: medicineName,
      message: `Standard clinical guidelines: Verify patient weight, renal/hepatic function, and manufacturer packaging for "${medicineName}". Strictly follow physician prescription.`
    };
  }
});
