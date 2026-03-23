import readline from "readline";
import path from "path";
import { HotelResolver } from "../lib/hotelResolver";
import { AgentManager } from "../lib/agentManager";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

async function runChat(hotelId?: string) {
  const hotelsBasePath = process.env.HOTELS_PATH || path.join(process.cwd(), "hotels");
  const resolver = new HotelResolver(hotelsBasePath);
  const agentManager = new AgentManager();

  const hotels = resolver.getAllHotels();

  if (hotels.length === 0) {
    console.log("No hotels found. Please check your hotels folder.");
    process.exit(1);
  }

  let selectedHotel = hotels[0];

  if (hotelId) {
    const found = hotels.find((h) => h.id === hotelId);
    if (!found) {
      console.log(`Hotel "${hotelId}" not found. Available hotels:`);
      hotels.forEach((h) => console.log(`  - ${h.id}: ${h.name}`));
      process.exit(1);
    }
    selectedHotel = found;
  } else if (hotels.length > 1) {
    console.log("Available hotels:");
    hotels.forEach((h, i) => console.log(`  ${i + 1}. ${h.id} - ${h.name}`));
    console.log("\nWhich hotel? (enter number or ID):");

    const answer = await new Promise<string>((resolve) => rl.question("", resolve));

    const num = parseInt(answer);
    if (!isNaN(num) && num > 0 && num <= hotels.length) {
      selectedHotel = hotels[num - 1];
    } else {
      const found = hotels.find((h) => h.id === answer);
      if (found) selectedHotel = found;
    }
  }

  if (!selectedHotel) {
    console.log("No hotel selected.");
    process.exit(1);
  }

  console.log(`\n=== Chatting with ${selectedHotel.name} ===`);
  console.log("(Type 'exit' to quit, 'switch' to change hotel, 'clear' to clear history)\n");

  const hotelFolder = resolver.getHotelFolder(selectedHotel.whatsappPhoneNumber);
  if (!hotelFolder) {
    console.log("Error: Hotel folder not found.");
    process.exit(1);
  }

  const agent = await agentManager.getAgentForHotel(selectedHotel, hotelFolder);

  const history: Message[] = [];

  async function chat() {
    const message = await new Promise<string>((resolve) => rl.question("You: ", resolve));

    if (message.toLowerCase() === "exit") {
      console.log("Goodbye!");
      process.exit(0);
    }

    if (message.toLowerCase() === "clear") {
      history.length = 0;
      console.log("History cleared.\n");
      chat();
      return;
    }

    if (message.toLowerCase() === "switch") {
      rl.question("", (answer) => {
        const found = hotels.find((h) => h.id === answer);
        if (found) {
          selectedHotel = found;
          history.length = 0;
          console.log(`\nSwitched to ${found.name}\n`);
        } else {
          console.log(`Hotel "${answer}" not found.\n`);
        }
        chat();
      });
      return;
    }

    history.push({ role: "user", content: message });

    try {
      const result = await agent.invoke({
        messages: history,
      });

      const lastMessage = result.messages[result.messages.length - 1];
      const response = lastMessage?.content as string;

      if (response) {
        history.push({ role: "assistant", content: response });
        console.log(`\n${selectedHotel!.name}: ${response}\n`);
      }
    } catch (error) {
      console.error("Error:", error);
    }

    chat();
  }

  chat();
}

const hotelArg = process.argv[2];
runChat(hotelArg);
