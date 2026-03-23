# Hotel Chat Bot

A multi-tenant WhatsApp chatbot platform for hotels. Each hotel has its own WhatsApp Business number, and the system automatically routes messages to the correct hotel's AI assistant.

## Features

- **Multi-tenant architecture** - Run multiple hotels from a single server
- **WhatsApp Business integration** - Respond to guests via WhatsApp
- **AI-powered responses** - Uses GPT-4.1 with hotel-specific prompts
- **Web search** - Tavily-powered search for local area information
- **Configurable per hotel** - Each hotel has its own config, system prompt, and picture folder
- **Conversation history** - Maintains context across messages

## Project Structure

```
src/
├── index.ts              # Main server entry point
├── lib/
│   ├── hotelResolver.ts     # Maps phone numbers to hotel configs
│   ├── agentManager.ts      # Creates and manages AI agents per hotel
│   └── whatsappHandler.ts  # WhatsApp webhook handler
├── tools/
│   └── tavilySearch.ts     # Internet search tool
└── test/
    ├── test-chat.ts        # Interactive CLI chat for testing
    └── tavily-test.ts      # Test Tavily search API
hotels/
└── the-cantabrian/
    ├── hotel.json          # Hotel configuration
    ├── system-prompt.txt   # Hotel-specific AI instructions
    └── pictures/           # Hotel images
.env                     # Environment variables (create from .env.example)
.env.example             # Environment variable template
```

## Quick Start

### 1. Install Dependencies

```bash
yarn install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env` and fill in the values:

```bash
cp .env.example .env
```

Edit `.env`:
- `META_ACCESS_TOKEN` - Get from Meta Developer Console
- `VERIFY_TOKEN` - Any random string for webhook verification
- `TAVILY_API_KEY` - Get free key at https://tavily.com/

### 3. Add a Hotel

Create a folder in `hotels/` with:
- `hotel.json` - Hotel configuration
- `system-prompt.txt` - AI instructions for this hotel
- `pictures/` - Optional folder for hotel images

### 4. Run the Server

```bash
yarn start
```

The server runs on port 3000 (or PORT from .env).

### 5. Expose to Internet (for WhatsApp webhooks)

```bash
ngrok http 3000
```

Then configure the webhook URL in Meta Developer Console.

## Running Tests

### Interactive Chat Test

Test the AI agent with multi-turn conversations:

```bash
yarn chat
```

Commands:
- Type a message and press Enter
- `switch` - Change to another hotel
- `clear` - Clear conversation history
- `exit` - Quit

### Tavily Search Test

Test the internet search functionality:

```bash
yarn test:tavily
```

## Adding a New Hotel

1. Create folder: `hotels/<hotel-id>/`
2. Add `hotel.json`:

```json
{
  "id": "hotel-id",
  "name": "Hotel Name",
  "whatsappPhoneNumber": "+1234567890",
  "metaPhoneNumberId": "your_meta_phone_number_id",
  "location": "Address",
  "phone": "+1234567890",
  "socials": {
    "instagram": "https://instagram.com/..."
  },
  "amenities": ["WiFi", "Pool"],
  "language": "en",
  "pictureFolder": "pictures"
}
```

3. Add `system-prompt.txt` with hotel-specific AI instructions
4. Optionally add images to `pictures/` folder
5. Restart the server

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `META_ACCESS_TOKEN` | Yes | Meta API access token |
| `VERIFY_TOKEN` | No | Webhook verify token (default: "my_verify_token") |
| `TAVILY_API_KEY` | Yes | Tavily API key for web search |
| `PORT` | No | Server port (default: 3000) |
| `HOTELS_PATH` | No | Custom path to hotels folder |

## How It Works

1. WhatsApp message arrives at hotel's business number
2. Webhook receives message, extracts business phone number
3. `HotelResolver` looks up hotel config by phone number
4. `AgentManager` creates/retrieves hotel's AI agent with hotel-specific prompt
5. Agent processes message (can use search tool for local info)
6. Response sent back via WhatsApp API

## License

MIT
