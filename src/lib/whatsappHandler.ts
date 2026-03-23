import express, { Request, Response } from "express";
import axios from "axios";
import { HotelResolver } from "./hotelResolver";
import { AgentManager } from "./agentManager";

interface WhatsAppMessage {
  from: string;
  id: string;
  timestamp: string;
  text?: { body: string };
  image?: { id: string; caption?: string };
}

interface WhatsAppEntry {
  id: string;
  changes: Array<{
    value: {
      messaging_product: string;
      metadata: {
        display_phone_number: string;
        phone_number_id: string;
      };
      messages?: WhatsAppMessage[];
    };
  }>;
}

interface WhatsAppWebhookBody {
  object: string;
  entry: WhatsAppEntry[];
}

export class WhatsAppHandler {
  private app: express.Application;
  private resolver: HotelResolver;
  private agentManager: AgentManager;
  private accessToken: string;
  private verifyToken: string;

  constructor(
    resolver: HotelResolver,
    agentManager: AgentManager,
    accessToken: string,
    verifyToken: string
  ) {
    this.app = express();
    this.resolver = resolver;
    this.agentManager = agentManager;
    this.accessToken = accessToken;
    this.verifyToken = verifyToken;
    this.setupWebhook();
  }

  private setupWebhook(): void {
    this.app.use(express.json());

    this.app.get("/webhook", (req: Request, res: Response) => {
      const mode = req.query["hub.mode"];
      const token = req.query["hub.verify_token"];
      const challenge = req.query["hub.challenge"];

      if (mode === "subscribe" && token === this.verifyToken) {
        console.log("Webhook verified!");
        res.status(200).send(challenge);
      } else {
        console.log("Webhook verification failed!");
        res.sendStatus(403);
      }
    });

    this.app.post("/webhook", async (req: Request, res: Response) => {
      try {
        await this.handleWebhook(req.body);
        res.status(200).send("OK");
      } catch (error) {
        console.error("Error handling webhook:", error);
        res.status(500).send("Error");
      }
    });

    this.app.get("/health", (req: Request, res: Response) => {
      res.status(200).json({ status: "ok", hotels: this.resolver.getAllHotels().length });
    });
  }

  private async handleWebhook(body: WhatsAppWebhookBody): Promise<void> {
    if (body.object !== "whatsapp_business_account") {
      console.log("Not a WhatsApp message");
      return;
    }

    const entry = body.entry?.[0];
    if (!entry) return;

    const changes = entry.changes?.[0];
    if (!changes?.value?.messages) return;

    const metadata = changes.value.metadata;
    const businessPhoneNumber = metadata.display_phone_number;
    const messages = changes.value.messages;

    console.log(`Received message from ${businessPhoneNumber}`);

    const hotel = this.resolver.getHotelByPhoneNumber(businessPhoneNumber);
    if (!hotel) {
      console.error(`Hotel not found for phone: ${businessPhoneNumber}`);
      return;
    }

    for (const message of messages) {
      const userMessage = message.text?.body || message.image?.caption || "";
      const userPhone = message.from;

      if (!userMessage) continue;

      console.log(`Message from ${userPhone}: ${userMessage}`);

      try {
        const hotelFolder = this.resolver.getHotelFolder(businessPhoneNumber);
        if (!hotelFolder) {
          console.error(`Hotel folder not found for: ${businessPhoneNumber}`);
          return;
        }

        const agent = await this.agentManager.getAgentForHotel(hotel, hotelFolder);

        const result = await agent.invoke({
          messages: [{ role: "user", content: userMessage }],
        });

        const lastMessage = result.messages[result.messages.length - 1];
        const responseText = lastMessage?.content as string;

        if (responseText) {
          await this.sendMessage(hotel.metaPhoneNumberId, userPhone, responseText);
        }
      } catch (error) {
        console.error("Error processing message:", error);
        await this.sendMessage(
          hotel.metaPhoneNumberId,
          userPhone,
          "I'm sorry, I'm having trouble processing your request. Please try again."
        );
      }
    }
  }

  private async sendMessage(phoneNumberId: string, to: string, message: string): Promise<void> {
    try {
      const url = `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`;

      await axios.post(
        url,
        {
          messaging_product: "whatsapp",
          to: to,
          text: { body: message },
        },
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      console.log(`Sent message to ${to}`);
    } catch (error: any) {
      console.error("Error sending message:", error.response?.data || error.message);
      throw error;
    }
  }

  getApp(): express.Application {
    return this.app;
  }
}
