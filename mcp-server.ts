#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

// In-memory balance store (shared state for MCP server)
const balances: Map<string, number> = new Map();

const AGENT_WALLET = process.env.AGENT_WALLET_ADDRESS || "0xAgentWallet";

function getBalance(address: string): number {
  return balances.get(address.toLowerCase()) || 0;
}

function addBalance(address: string, amount: number): number {
  const current = getBalance(address);
  const newBalance = current + amount;
  balances.set(address.toLowerCase(), newBalance);
  return newBalance;
}

function spendBalance(address: string, amount: number): number {
  const current = getBalance(address);
  if (current < amount) {
    throw new Error(`Insufficient funds. Has: ${current}, needs: ${amount}`);
  }
  const newBalance = current - amount;
  balances.set(address.toLowerCase(), newBalance);
  return newBalance;
}

// Create the MCP server
const server = new McpServer({
  name: "monad-blitz-butler",
  version: "1.0.0",
});

// Tool: Check Balance
server.tool(
  "check_balance",
  "Check the current balance of the agent wallet in USDC",
  {},
  async () => {
    const balance = getBalance(AGENT_WALLET);
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            wallet: AGENT_WALLET,
            balance: balance,
            currency: "USDC",
          }, null, 2),
        },
      ],
    };
  }
);

// Tool: Make Deposit
server.tool(
  "make_deposit",
  "Deposit funds (USDC) into the agent wallet to enable paid operations",
  {
    amount: z.number().positive().describe("Amount to deposit in USDC"),
    userWallet: z.string().optional().describe("User wallet address making the deposit"),
  },
  async ({ amount, userWallet }) => {
    const newBalance = addBalance(AGENT_WALLET, amount);
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            success: true,
            deposited: amount,
            newBalance: newBalance,
            agentWallet: AGENT_WALLET,
            fromWallet: userWallet || "unknown",
            message: `Successfully deposited ${amount} USDC to agent wallet`,
          }, null, 2),
        },
      ],
    };
  }
);

// Tool: Paid Search
server.tool(
  "paid_search",
  "Perform a paid web search. Costs 1 USDC per search. Returns simulated search results.",
  {
    query: z.string().describe("The search query to execute"),
  },
  async ({ query }) => {
    const cost = 1;
    const balance = getBalance(AGENT_WALLET);

    if (balance < cost) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              error: "402 Payment Required",
              message: `Insufficient funds. Need ${cost} USDC, have ${balance} USDC`,
              required: cost,
              available: balance,
              action: "Please deposit more funds using make_deposit tool",
            }, null, 2),
          },
        ],
        isError: true,
      };
    }

    spendBalance(AGENT_WALLET, cost);
    const newBalance = getBalance(AGENT_WALLET);

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            success: true,
            query: query,
            cost: cost,
            newBalance: newBalance,
            results: [
              { title: `Result 1 for "${query}"`, url: "https://example.com/1", snippet: "This is a simulated search result with relevant information..." },
              { title: `Result 2 for "${query}"`, url: "https://example.com/2", snippet: "Another relevant finding about your query..." },
              { title: `Result 3 for "${query}"`, url: "https://example.com/3", snippet: "More comprehensive information about the topic..." },
            ],
          }, null, 2),
        },
      ],
    };
  }
);

// Tool: Paid API Call
server.tool(
  "paid_api_call",
  "Make a paid API call to an external service. Costs 0.50 USDC per call.",
  {
    service: z.enum(["weather", "stocks", "news", "crypto"]).describe("The service to call"),
    params: z.string().optional().describe("Additional parameters for the API call"),
  },
  async ({ service, params }) => {
    const cost = 0.5;
    const balance = getBalance(AGENT_WALLET);

    if (balance < cost) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              error: "402 Payment Required",
              message: `Insufficient funds. Need ${cost} USDC, have ${balance} USDC`,
              required: cost,
              available: balance,
              action: "Please deposit more funds using make_deposit tool",
            }, null, 2),
          },
        ],
        isError: true,
      };
    }

    spendBalance(AGENT_WALLET, cost);
    const newBalance = getBalance(AGENT_WALLET);

    // Simulate different API responses based on service
    const serviceResponses: Record<string, object> = {
      weather: {
        location: params || "New York",
        temperature: "72°F",
        condition: "Partly Cloudy",
        humidity: "45%",
      },
      stocks: {
        symbol: params || "AAPL",
        price: "$178.50",
        change: "+2.3%",
        volume: "52.4M",
      },
      news: {
        topic: params || "technology",
        headlines: [
          "AI continues to transform industries",
          "New blockchain developments announced",
          "Tech stocks show strong performance",
        ],
      },
      crypto: {
        asset: params || "ETH",
        price: "$3,450.00",
        change24h: "+5.2%",
        marketCap: "$415B",
      },
    };

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            success: true,
            service: service,
            cost: cost,
            newBalance: newBalance,
            timestamp: new Date().toISOString(),
            data: serviceResponses[service],
          }, null, 2),
        },
      ],
    };
  }
);

// Tool: Agent Chat (full conversation with the AI agent)
server.tool(
  "agent_chat",
  "Send a message to the Blitz Butler AI agent. The agent can check balances, perform paid searches, and make API calls on your behalf.",
  {
    message: z.string().describe("The message to send to the agent"),
  },
  async ({ message }) => {
    // For MCP, we provide a simplified response since we don't have OpenAI here
    // In production, you'd call the /api/agent endpoint or integrate OpenAI directly

    const balance = getBalance(AGENT_WALLET);

    // Simple command parsing for direct MCP usage
    const lowerMessage = message.toLowerCase();

    if (lowerMessage.includes("balance") || lowerMessage.includes("how much")) {
      return {
        content: [
          {
            type: "text",
            text: `Your agent wallet (${AGENT_WALLET}) currently has ${balance} USDC.\n\nAvailable actions:\n- Paid search: 1 USDC\n- API calls: 0.50 USDC\n\nUse the specific tools (paid_search, paid_api_call) for paid operations.`,
          },
        ],
      };
    }

    return {
      content: [
        {
          type: "text",
          text: `Blitz Butler received your message: "${message}"\n\nCurrent balance: ${balance} USDC\n\nFor paid operations, use the dedicated tools:\n- paid_search: Search the web (1 USDC)\n- paid_api_call: Call external APIs (0.50 USDC)\n- make_deposit: Add funds to wallet\n- check_balance: View current balance`,
        },
      ],
    };
  }
);

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Monad Blitz Butler MCP server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
