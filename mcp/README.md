# Monad Blitz Butler MCP Server

MCP (Model Context Protocol) server for AI-powered food ordering with cryptocurrency payments on Monad blockchain.

## Installation

```bash
npm install -g monad-blitz-butler-mcp
```

Or run directly with npx:

```bash
npx monad-blitz-butler-mcp
```

## Configuration

### Claude Desktop

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "MonadBlitzButler": {
      "command": "npx",
      "args": ["monad-blitz-butler-mcp"],
      "env": {
        "OPENAI_API_KEY": "<your-openai-api-key>",
        "TAVILY_API_KEY": "<your-tavily-api-key>",
        "GOOGLE_PLACES_API_KEY": "<your-google-places-api-key>",
        "VAPI_SECRET_KEY": "<your-vapi-secret-key>"
      }
    }
  }
}
```

### Other MCP Clients

Get the configuration template:

```bash
monad-blitz-butler-mcp --print-config
```

## Available Tools

| Tool | Description | Cost |
|------|-------------|------|
| `checkBalance` | Check agent wallet balance | FREE |
| `findRestaurants` | Search for restaurants | FREE |
| `getMenuDetails` | Extract menu from website | FREE |
| `webSearch` | Web search via Tavily | 0.5 USDC |
| `placeOrder` | Place a food order | 1 USDC + order total |
| `callBusiness` | AI phone call to business | 0.1 USDC |
| `requestDeliveryQuote` | Get DoorDash delivery quote | FREE |
| `confirmDelivery` | Dispatch delivery | Delivery fee |

## Example Prompts

- "Find me pizza restaurants in San Francisco"
- "What's on the menu at Gracias Madre?"
- "Order a burrito bowl from Chipotle for $12"
- "Call Joe's Pizza and ask about wait time"
- "Search for the best ramen in NYC"

## License

MIT
