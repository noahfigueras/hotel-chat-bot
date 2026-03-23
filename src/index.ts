import path from "path";
import { HotelResolver } from "./lib/hotelResolver";
import { AgentManager } from "./lib/agentManager";
import { WhatsAppHandler } from "./lib/whatsappHandler";

const PORT = process.env.PORT || 3000;

const META_ACCESS_TOKEN = process.env.META_ACCESS_TOKEN;
const VERIFY_TOKEN = process.env.VERIFY_TOKEN || "my_verify_token";

if (!META_ACCESS_TOKEN) {
  console.error("Missing required environment variable:");
  console.error("- META_ACCESS_TOKEN");
  console.error("\nPlease set this in your .env file");
  process.exit(1);
}

const hotelsBasePath = process.env.HOTELS_PATH || path.join(process.cwd(), "hotels");
const resolver = new HotelResolver(hotelsBasePath);
const agentManager = new AgentManager();

const whatsappHandler = new WhatsAppHandler(
  resolver,
  agentManager,
  META_ACCESS_TOKEN,
  VERIFY_TOKEN
);

const app = whatsappHandler.getApp();

app.listen(PORT, () => {
  console.log(`Hotel ChatBot server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`Webhook endpoint: http://localhost:${PORT}/webhook`);
  console.log("\nDon't forget to:");
  console.log("1. Set up ngrok: ngrok http 3000");
  console.log("2. Configure webhook URL in Meta developer console");
  console.log("\nTo add a new hotel:");
  console.log("1. Create folder: hotels/<hotel-id>");
  console.log("2. Add hotel.json with config (whatsappPhoneNumber + metaPhoneNumberId)");
  console.log("3. Add system-prompt.txt with instructions");
  console.log("\nOr set HOTELS_PATH environment variable to custom location");
});
