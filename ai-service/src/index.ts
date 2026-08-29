import { VoltAgent } from "@voltagent/core";
import { honoServer } from "@voltagent/server-hono";
import { createPinoLogger } from "@voltagent/logger";
import { searchAgent, demandPredictionAgent, pharmacyConsultantAgent } from "./agents";
import { compatApp } from "./routes/compatRoutes";
import dotenv from "dotenv";

dotenv.config();

const port = Number(process.env.PORT) || 8000;

const logger = createPinoLogger({
  name: "smart-pharmacy-ai",
  level: "info"
});

// Initialize VoltAgent runtime with Hono server
const voltApp = new VoltAgent({
  agents: {
    medicineSearch: searchAgent,
    demandPrediction: demandPredictionAgent,
    pharmacyConsultant: pharmacyConsultantAgent
  },
  server: honoServer({
    port,
    configureApp: (app) => {
      // Mount compatibility routes directly onto Hono app
      app.route("/", compatApp);
    }
  }),
  logger
});

console.log(`🤖 VoltAgent AI Service initialized on port ${port} with OpenRouter provider.`);

export default voltApp;
