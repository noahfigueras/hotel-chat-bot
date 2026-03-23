import { createDeepAgent } from "deepagents";
import { HotelConfig } from "./hotelResolver";
import { internetSearch } from "../tools/tavilySearch";
import fs from "fs";
import path from "path";

export class AgentManager {
  private agents: Map<string, any> = new Map();

  async getAgentForHotel(
    hotel: HotelConfig,
    hotelFolder: string
  ): Promise<any> {
    const existingAgent = this.agents.get(hotel.id);
    if (existingAgent) {
      return existingAgent;
    }

    const systemPrompt = this.loadSystemPrompt(hotel.id, hotelFolder);

    const agent = createDeepAgent({
      model: "openai:gpt-4.1-mini",
      tools: [internetSearch],
      systemPrompt: systemPrompt,
    });

    this.agents.set(hotel.id, agent);
    console.log(`Created agent for hotel: ${hotel.name}`);

    return agent;
  }

  private loadSystemPrompt(hotelId: string, hotelFolder: string): string {
    const promptPath = path.join(hotelFolder, "system-prompt.txt");

    if (fs.existsSync(promptPath)) {
      return fs.readFileSync(promptPath, "utf-8");
    }

    return this.getDefaultPrompt(hotelId);
  }

  private getDefaultPrompt(hotelId: string): string {
    return `You are a hotel assistant for ${hotelId}. Answer guest questions professionally.`;
  }

  clearCache(): void {
    this.agents.clear();
  }
}
