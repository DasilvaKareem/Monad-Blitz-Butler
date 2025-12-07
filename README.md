<p align="center">
  <img src="public/logo.png" alt="Monad Blitz Butler" width="120" />
</p>

<h1 align="center">Monad Blitz Butler</h1>

<p align="center">
  <strong>AI-Powered Food Ordering Agent with Real Crypto Payments</strong>
</p>

<p align="center">
  <a href="#quickstart">Quickstart</a> •
  <a href="#features">Features</a> •
  <a href="#mcp-integration">MCP Integration</a> •
  <a href="#api-reference">API Reference</a> •
  <a href="#configuration">Configuration</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-14-black" alt="Next.js" />
  <img src="https://img.shields.io/badge/OpenAI-Realtime_API-412991" alt="OpenAI" />
  <img src="https://img.shields.io/badge/Monad-Blockchain-purple" alt="Monad" />
  <img src="https://img.shields.io/badge/x402-Payments-gold" alt="x402" />
</p>

---

## Overview

Monad Blitz Butler is an AI voice agent that can search for restaurants, browse menus, place food orders, and make phone calls to businesses - all powered by real cryptocurrency payments on the Monad blockchain using the x402 payment protocol.

**Key Highlights:**
- 🎤 **Voice Interface** - Talk naturally using OpenAI's Realtime API
- 🍕 **Food Ordering** - Search restaurants, view menus, place orders
- 📞 **AI Phone Calls** - Agent calls businesses on your behalf (reservations, inquiries)
- 💰 **Real Payments** - x402 protocol for micropayments in USDC
- 🔗 **MCP Server** - Integrate with Claude Desktop, Cursor, and other MCP clients

---

## Quickstart

### Prerequisites

- Node.js 20+
- OpenAI API key with Realtime API access
- (Optional) Tavily API key for enhanced search
- (Optional) Vapi API key for phone calls

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/monad-blitz-butler
cd monad-blitz-butler

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env
```

### Environment Setup

Edit `.env` with your API keys:

```env
# Required
OPENAI_API_KEY=sk-proj-...

# Thirdweb (for wallet connection)
NEXT_PUBLIC_THIRDWEB_CLIENT_ID=your_client_id
THIRDWEB_SECRET_KEY=your_secret_key

# Optional - Enhanced Features
TAVILY_API_KEY=tvly-...           # Web search & menu extraction
GOOGLE_PLACES_API_KEY=AIza...     # Restaurant search
VAPI_SECRET_KEY=...               # AI phone calls
VAPI_PUBLIC_KEY=...
```

### Run the Application

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and start talking to your AI butler!

---

## Features

### 🍽️ Restaurant Discovery
- Search restaurants by cuisine, location, dietary preferences
- View ratings, hours, phone numbers, and websites
- Automatic filtering based on user preferences

### 📋 Menu Browsing
- Extract menu items and prices from restaurant websites
- AI-powered menu analysis using Tavily Extract API
- Support for dietary restrictions and allergies

### 🛒 Food Ordering
- Place orders with itemized breakdown
- Automatic tax calculation
- Delivery vs pickup options
- x402 payment processing

### 📞 AI Phone Calls
- Make reservations at restaurants
- Ask about wait times, hours, availability
- Powered by Vapi AI voice

### ⚙️ User Preferences
- Save dietary preferences (Vegan, Vegetarian, Gluten-Free, etc.)
- Food allergies tracking
- Cuisine preferences
- Price range filtering
- Location settings

---

## MCP Integration

Monad Blitz Butler includes an MCP (Model Context Protocol) server that enables integration with Claude Desktop, Cursor, Windsurf, and other MCP-compatible clients.

### Quickstart with Claude Desktop

1. **Install the MCP server:**

```bash
npm install -g monad-blitz-butler-mcp
```

2. **Configure Claude Desktop:**

Go to `Claude > Settings > Developer > Edit Config > claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "MonadBlitzButler": {
      "command": "npx",
      "args": ["monad-blitz-butler-mcp"],
      "env": {
        "OPENAI_API_KEY": "<your-openai-api-key>",
        "TAVILY_API_KEY": "<your-tavily-api-key>",
        "GOOGLE_PLACES_API_KEY": "<your-google-places-api-key>"
      }
    }
  }
}
```

3. **Restart Claude Desktop** and start using the tools!

### Available MCP Tools

| Tool | Description | Cost |
|------|-------------|------|
| `findRestaurants` | Search for restaurants by query and location | FREE |
| `getMenuDetails` | Extract menu items from restaurant website | FREE |
| `webSearch` | Perform a web search | 0.5 USDC |
| `placeOrder` | Place a food order | 1 USDC + order total |
| `callBusiness` | Make an AI phone call | 0.1 USDC |
| `checkBalance` | Check agent wallet balance | FREE |
| `requestDeliveryQuote` | Get DoorDash delivery quote | FREE |
| `confirmDelivery` | Confirm and dispatch delivery | Delivery fee |

### Example Prompts for Claude

Try these with Claude Desktop:

- *"Find me vegan restaurants near San Francisco"*
- *"What's on the menu at Gracias Madre?"*
- *"Order a burrito bowl with guacamole from Chipotle"*
- *"Call Joe's Pizza and ask about their wait time"*
- *"Search for the best ramen in New York City"*

### Other MCP Clients

For Cursor, Windsurf, and other clients:

```bash
# Install globally
npm install -g monad-blitz-butler-mcp

# Get configuration
monad-blitz-butler-mcp --print-config
```

Paste the output into your client's MCP configuration.

---

## API Reference

### REST Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/session` | GET | Get OpenAI Realtime session token |
| `/api/balance` | GET | Get agent wallet balance |
| `/api/deposit` | POST | Deposit funds to agent wallet |
| `/api/places` | GET | Search restaurants (Google Places + Tavily) |
| `/api/menu-scrape` | GET | Extract menu from website |
| `/api/web-search` | GET | Web search (Tavily/DuckDuckGo) |
| `/api/vapi-call` | POST | Initiate AI phone call |
| `/api/doordash/*` | Various | DoorDash delivery integration |

### x402 Payment Protocol

All paid operations use the x402 payment protocol:

```typescript
// Example: Checking balance before operation
const balance = getBalance();
if (balance < cost) {
  return {
    success: false,
    error: '402 Payment Required',
    message: `Insufficient funds. Need ${cost} USDC, have ${balance} USDC.`,
    required: cost,
    available: balance,
  };
}

// Deduct payment
const result = spendBalance(cost);
```

---

## Configuration

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `OPENAI_API_KEY` | Yes | OpenAI API key with Realtime API access |
| `NEXT_PUBLIC_THIRDWEB_CLIENT_ID` | Yes | Thirdweb client ID for wallet |
| `THIRDWEB_SECRET_KEY` | Yes | Thirdweb secret key |
| `TAVILY_API_KEY` | No | Tavily API for enhanced search |
| `GOOGLE_PLACES_API_KEY` | No | Google Places API for restaurants |
| `VAPI_SECRET_KEY` | No | Vapi secret key for phone calls |
| `VAPI_PUBLIC_KEY` | No | Vapi public key |
| `AGENT_PRIVATE_KEY` | No | Agent wallet private key |
| `AGENT_WALLET_ADDRESS` | No | Agent wallet address |

### User Preferences

Users can configure preferences via the UI:

- **Location**: City or address for restaurant searches
- **Dietary Options**: Vegan, Vegetarian, Gluten-Free, Dairy-Free, Halal, Kosher, Organic, Keto, Paleo
- **Allergies**: Peanuts, Tree Nuts, Milk, Eggs, Wheat, Soy, Fish, Shellfish, Sesame + custom
- **Cuisines**: American, Mexican, Italian, Japanese, Chinese, Korean, Thai, Vietnamese, Indian, Mediterranean, Greek, Middle Eastern, French, Spanish, Caribbean, Fusion
- **Price Range**: $, $$, $$$, $$$$

---

## Architecture

```
monad-blitz-butler/
├── src/
│   ├── app/
│   │   ├── api/                    # API routes
│   │   │   ├── session/            # OpenAI session
│   │   │   ├── places/             # Restaurant search
│   │   │   ├── menu-scrape/        # Menu extraction
│   │   │   ├── web-search/         # Web search
│   │   │   ├── vapi-call/          # Phone calls
│   │   │   └── doordash/           # Delivery
│   │   ├── agentConfigs/           # Agent definitions
│   │   │   └── monadButler/        # Butler agent
│   │   ├── components/             # UI components
│   │   │   ├── Transcript.tsx      # Chat transcript
│   │   │   ├── RestaurantCard.tsx  # Restaurant cards
│   │   │   ├── OrderCard.tsx       # Order display
│   │   │   └── ConfigureModal.tsx  # Preferences
│   │   ├── hooks/                  # React hooks
│   │   └── contexts/               # React contexts
│   └── components/                 # Shared components
├── mcp/                            # MCP server
│   ├── server.ts                   # MCP server entry
│   └── tools/                      # MCP tools
└── public/                         # Static assets
```

---

## Development

### Running Locally

```bash
# Development mode
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

### Testing the MCP Server

```bash
# Run MCP inspector
npx @modelcontextprotocol/inspector mcp/server.ts
```

---

## Troubleshooting

### Common Issues

**"Failed to parse SessionDescription"**
- Ensure your OpenAI API key has Realtime API access
- Check that you're using the correct model: `gpt-4o-realtime-preview-2025-06-03`

**"Google Places API REQUEST_DENIED"**
- Your API key may have HTTP referrer restrictions
- Create a new key without restrictions or use IP-based restrictions

**"Insufficient funds"**
- Fund your agent wallet using the "Fund Agent" button
- Check your balance with the `checkBalance` tool

### Logs

Check browser console and terminal for detailed error messages.

---

## Contributing

Contributions are welcome! Please read our contributing guidelines before submitting PRs.

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

---

## License

MIT License - see [LICENSE](LICENSE) for details.

---

## Acknowledgments

- [OpenAI Realtime API](https://platform.openai.com/docs/guides/realtime)
- [OpenAI Agents SDK](https://github.com/openai/openai-agents-js)
- [Thirdweb](https://thirdweb.com/)
- [Tavily](https://tavily.com/)
- [Vapi](https://vapi.ai/)
- [Model Context Protocol](https://modelcontextprotocol.io/)

---

<p align="center">
  Built with ❤️ for the Monad ecosystem
</p>
