#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";

// Simulated agent balance (in production, use a database or blockchain)
let agentBalance = 10.0; // Start with 10 USDC for demo

function getBalance(): number {
  return agentBalance;
}

function spendBalance(amount: number): { success: boolean; newBalance: number; error?: string } {
  if (agentBalance < amount) {
    return {
      success: false,
      newBalance: agentBalance,
      error: `Insufficient funds. Need ${amount} USDC, have ${agentBalance} USDC`,
    };
  }
  agentBalance -= amount;
  return { success: true, newBalance: agentBalance };
}

function addBalance(amount: number): number {
  agentBalance += amount;
  return agentBalance;
}

// Tool definitions
const tools: Tool[] = [
  {
    name: "checkBalance",
    description: "Check the current balance of the agent wallet. FREE.",
    inputSchema: {
      type: "object",
      properties: {},
      required: [],
    },
  },
  {
    name: "findRestaurants",
    description: "Search for restaurants and food places. FREE. Returns name, rating, price, website, phone, and hours.",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "What to search for (e.g., 'pizza', 'chinese food', 'sushi near me')",
        },
        location: {
          type: "string",
          description: "Location to search in (e.g., 'San Francisco, CA')",
        },
      },
      required: ["query"],
    },
  },
  {
    name: "getMenuDetails",
    description: "Extract menu items and prices from a restaurant website. FREE.",
    inputSchema: {
      type: "object",
      properties: {
        website: {
          type: "string",
          description: "The restaurant website URL to scrape for menu details",
        },
      },
      required: ["website"],
    },
  },
  {
    name: "webSearch",
    description: "Perform a web search using Tavily. PAID - costs 0.5 USDC per search.",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "The search query",
        },
      },
      required: ["query"],
    },
  },
  {
    name: "placeOrder",
    description: "Place a food order. PAID - costs 1 USDC service fee + food cost + tax.",
    inputSchema: {
      type: "object",
      properties: {
        restaurant: {
          type: "string",
          description: "Name of the restaurant",
        },
        items: {
          type: "array",
          description: "Array of items with name, price, quantity",
          items: {
            type: "object",
            properties: {
              name: { type: "string" },
              price: { type: "number" },
              quantity: { type: "number" },
            },
          },
        },
        totalCost: {
          type: "number",
          description: "Total cost in USDC",
        },
        deliveryAddress: {
          type: "string",
          description: "Delivery address (leave empty for pickup)",
        },
      },
      required: ["restaurant", "items", "totalCost"],
    },
  },
  {
    name: "callBusiness",
    description: "Call a business using AI voice. PAID - costs 0.1 USDC per call.",
    inputSchema: {
      type: "object",
      properties: {
        phoneNumber: {
          type: "string",
          description: "The phone number to call",
        },
        businessName: {
          type: "string",
          description: "Name of the business being called",
        },
        purpose: {
          type: "string",
          description: "What to ask or accomplish on the call",
        },
      },
      required: ["phoneNumber", "purpose"],
    },
  },
  {
    name: "requestDeliveryQuote",
    description: "Request a DoorDash delivery quote. FREE.",
    inputSchema: {
      type: "object",
      properties: {
        pickupAddress: {
          type: "string",
          description: "Restaurant/pickup address",
        },
        dropoffAddress: {
          type: "string",
          description: "Delivery destination address",
        },
        orderValue: {
          type: "number",
          description: "Total order value in USD",
        },
      },
      required: ["pickupAddress", "dropoffAddress", "orderValue"],
    },
  },
  {
    name: "confirmDelivery",
    description: "Confirm and dispatch a DoorDash delivery. PAID - delivery fee applies.",
    inputSchema: {
      type: "object",
      properties: {
        quoteId: {
          type: "string",
          description: "The quote ID from requestDeliveryQuote",
        },
      },
      required: ["quoteId"],
    },
  },
];

// Tool implementations
async function findRestaurants(query: string, location?: string): Promise<any> {
  const TAVILY_API_KEY = process.env.TAVILY_API_KEY;
  const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY;

  // Try Google Places first
  if (GOOGLE_PLACES_API_KEY) {
    try {
      const searchQuery = location ? `${query} in ${location}` : query;
      const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(searchQuery)}&type=restaurant&key=${GOOGLE_PLACES_API_KEY}`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.status === "OK" && data.results?.length > 0) {
        const restaurants = data.results.slice(0, 5).map((place: any) => ({
          name: place.name,
          address: place.formatted_address,
          rating: place.rating,
          userRatingsTotal: place.user_ratings_total,
          priceLevel: place.price_level ? "$".repeat(place.price_level) : "N/A",
          openNow: place.opening_hours?.open_now,
          placeId: place.place_id,
        }));

        return {
          success: true,
          query,
          location,
          source: "google_places",
          restaurants,
        };
      }
    } catch (error) {
      console.error("Google Places error:", error);
    }
  }

  // Fallback to Tavily
  if (TAVILY_API_KEY) {
    try {
      const searchQuery = location
        ? `best ${query} restaurants in ${location}`
        : `best ${query} restaurants`;

      const response = await fetch("https://api.tavily.com/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          api_key: TAVILY_API_KEY,
          query: searchQuery,
          search_depth: "basic",
          include_images: true,
          max_results: 5,
        }),
      });

      const data = await response.json();

      const restaurants = (data.results || []).map((result: any) => ({
        name: result.title,
        url: result.url,
        description: result.content,
        image: result.images?.[0],
      }));

      return {
        success: true,
        query,
        location,
        source: "tavily",
        restaurants,
      };
    } catch (error) {
      console.error("Tavily error:", error);
    }
  }

  return {
    success: false,
    error: "No API keys configured for restaurant search. Set GOOGLE_PLACES_API_KEY or TAVILY_API_KEY.",
  };
}

async function getMenuDetails(website: string): Promise<any> {
  const TAVILY_API_KEY = process.env.TAVILY_API_KEY;

  if (!TAVILY_API_KEY) {
    return {
      success: false,
      error: "TAVILY_API_KEY not configured for menu extraction",
    };
  }

  try {
    const response = await fetch("https://api.tavily.com/extract", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        api_key: TAVILY_API_KEY,
        urls: [website],
      }),
    });

    const data = await response.json();
    const content = data.results?.[0]?.raw_content || data.results?.[0]?.content || "";

    // Parse menu items from content
    const pricePattern = /\$\d+(?:\.\d{2})?/g;
    const pricesFound = content.match(pricePattern) || [];

    // Look for menu item patterns
    const menuItems: Array<{ name: string; price: string }> = [];
    const lines = content.split(/[\n\r]+/);

    for (const line of lines) {
      const priceMatch = line.match(/\$(\d+(?:\.\d{2})?)/);
      if (priceMatch) {
        const name = line.replace(/\$\d+(?:\.\d{2})?/, "").trim();
        if (name.length > 2 && name.length < 100) {
          menuItems.push({
            name: name.substring(0, 50),
            price: priceMatch[0],
          });
        }
      }
    }

    return {
      success: true,
      website,
      menuItems: menuItems.slice(0, 20),
      pricesFound: [...new Set(pricesFound)].slice(0, 10),
      note: menuItems.length > 0
        ? `Found ${menuItems.length} menu items`
        : "Menu items extracted from website content",
    };
  } catch (error) {
    return {
      success: false,
      website,
      error: "Failed to extract menu details",
    };
  }
}

async function webSearch(query: string): Promise<any> {
  const SEARCH_COST = 0.5;
  const balance = getBalance();

  if (balance < SEARCH_COST) {
    return {
      success: false,
      error: "402 Payment Required",
      message: `Insufficient funds. Web search costs ${SEARCH_COST} USDC, but you only have ${balance} USDC.`,
      required: SEARCH_COST,
      available: balance,
    };
  }

  const TAVILY_API_KEY = process.env.TAVILY_API_KEY;

  if (!TAVILY_API_KEY) {
    return {
      success: false,
      error: "TAVILY_API_KEY not configured for web search",
    };
  }

  try {
    const response = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        api_key: TAVILY_API_KEY,
        query,
        search_depth: "basic",
        include_images: true,
        max_results: 5,
      }),
    });

    const data = await response.json();

    // Charge for the search
    const result = spendBalance(SEARCH_COST);

    return {
      success: true,
      query,
      results: data.results || [],
      cost: SEARCH_COST,
      newBalance: result.newBalance,
      message: `Charged ${SEARCH_COST} USDC for web search. New balance: ${result.newBalance} USDC`,
    };
  } catch (error) {
    return {
      success: false,
      query,
      error: "Search failed",
    };
  }
}

async function placeOrder(
  restaurant: string,
  items: Array<{ name: string; price: number; quantity?: number }>,
  totalCost: number,
  deliveryAddress?: string
): Promise<any> {
  const SERVICE_FEE = 1.0;
  const balance = getBalance();
  const totalWithServiceFee = totalCost + SERVICE_FEE;

  if (balance < totalWithServiceFee) {
    return {
      success: false,
      error: "402 Payment Required",
      message: `Insufficient funds. Order costs ${totalCost} USDC + ${SERVICE_FEE} USDC service fee = ${totalWithServiceFee} USDC total, but you only have ${balance} USDC.`,
      required: totalWithServiceFee,
      available: balance,
    };
  }

  const result = spendBalance(totalWithServiceFee);

  const subtotal = items.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);
  const tax = subtotal * 0.0875;

  return {
    success: true,
    orderId: `ORD-${Date.now()}`,
    restaurant,
    items: items.map(i => ({ ...i, quantity: i.quantity || 1 })),
    subtotal,
    tax,
    serviceFee: SERVICE_FEE,
    totalCost: totalWithServiceFee,
    newBalance: result.newBalance,
    deliveryAddress: deliveryAddress || null,
    estimatedTime: deliveryAddress ? "30-45 minutes" : "15-20 minutes (pickup)",
    message: `Order placed! Charged ${totalWithServiceFee} USDC. New balance: ${result.newBalance} USDC`,
  };
}

async function callBusiness(phoneNumber: string, purpose: string, businessName?: string): Promise<any> {
  const CALL_COST = 0.1;
  const balance = getBalance();

  if (balance < CALL_COST) {
    return {
      success: false,
      error: "402 Payment Required",
      message: `Insufficient funds. Phone call costs ${CALL_COST} USDC, but you only have ${balance} USDC.`,
      required: CALL_COST,
      available: balance,
    };
  }

  const VAPI_SECRET_KEY = process.env.VAPI_SECRET_KEY;

  if (!VAPI_SECRET_KEY) {
    // Demo mode without Vapi
    const result = spendBalance(CALL_COST);
    return {
      success: true,
      demoMode: true,
      callId: `DEMO-${Date.now()}`,
      status: "simulated",
      phoneNumber,
      businessName: businessName || "Unknown business",
      purpose,
      cost: CALL_COST,
      newBalance: result.newBalance,
      message: `[DEMO MODE] Would call ${phoneNumber}. Purpose: ${purpose}. Charged ${CALL_COST} USDC. New balance: ${result.newBalance} USDC`,
    };
  }

  try {
    const response = await fetch("https://api.vapi.ai/call", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${VAPI_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        phoneNumber,
        assistantId: process.env.VAPI_ASSISTANT_ID,
        metadata: {
          businessName,
          purpose,
        },
      }),
    });

    const data = await response.json();
    const result = spendBalance(CALL_COST);

    return {
      success: true,
      callId: data.id,
      status: data.status,
      phoneNumber,
      businessName: businessName || "Unknown business",
      purpose,
      cost: CALL_COST,
      newBalance: result.newBalance,
      message: `Call initiated to ${phoneNumber}. Charged ${CALL_COST} USDC. New balance: ${result.newBalance} USDC`,
    };
  } catch (error) {
    return {
      success: false,
      error: "Failed to initiate call",
    };
  }
}

async function requestDeliveryQuote(
  pickupAddress: string,
  dropoffAddress: string,
  orderValue: number
): Promise<any> {
  // Simulated delivery quote
  const baseFee = 5.99;
  const distanceFee = Math.random() * 3; // Random 0-3 based on "distance"
  const totalFee = Math.round((baseFee + distanceFee) * 100) / 100;

  return {
    success: true,
    quoteId: `QUOTE-${Date.now()}`,
    pickupAddress,
    dropoffAddress,
    orderValue,
    deliveryFee: totalFee,
    estimatedDeliveryTime: "25-35 minutes",
    message: `Delivery quote: $${totalFee} fee, estimated 25-35 minutes`,
  };
}

async function confirmDelivery(quoteId: string): Promise<any> {
  // Extract fee from quote (in production, look up from database)
  const deliveryFee = 7.99; // Simulated
  const balance = getBalance();

  if (balance < deliveryFee) {
    return {
      success: false,
      error: "402 Payment Required",
      message: `Insufficient funds. Delivery costs ${deliveryFee} USDC, but you only have ${balance} USDC.`,
      required: deliveryFee,
      available: balance,
    };
  }

  const result = spendBalance(deliveryFee);

  return {
    success: true,
    deliveryId: `DEL-${Date.now()}`,
    quoteId,
    status: "dispatched",
    cost: deliveryFee,
    newBalance: result.newBalance,
    message: `Delivery confirmed! Dasher dispatched. Charged ${deliveryFee} USDC. New balance: ${result.newBalance} USDC`,
  };
}

// Create and start the server
const server = new Server(
  {
    name: "monad-blitz-butler",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Handle tool listing
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools };
});

// Handle tool execution
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    let result: any;

    switch (name) {
      case "checkBalance":
        result = {
          balance: getBalance(),
          currency: "USDC",
          message: `Current balance: ${getBalance()} USDC`,
        };
        break;

      case "findRestaurants":
        result = await findRestaurants(args?.query as string, args?.location as string);
        break;

      case "getMenuDetails":
        result = await getMenuDetails(args?.website as string);
        break;

      case "webSearch":
        result = await webSearch(args?.query as string);
        break;

      case "placeOrder":
        result = await placeOrder(
          args?.restaurant as string,
          args?.items as Array<{ name: string; price: number; quantity?: number }>,
          args?.totalCost as number,
          args?.deliveryAddress as string
        );
        break;

      case "callBusiness":
        result = await callBusiness(
          args?.phoneNumber as string,
          args?.purpose as string,
          args?.businessName as string
        );
        break;

      case "requestDeliveryQuote":
        result = await requestDeliveryQuote(
          args?.pickupAddress as string,
          args?.dropoffAddress as string,
          args?.orderValue as number
        );
        break;

      case "confirmDelivery":
        result = await confirmDelivery(args?.quoteId as string);
        break;

      default:
        throw new Error(`Unknown tool: ${name}`);
    }

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
          }),
        },
      ],
      isError: true,
    };
  }
});

// Main entry point
async function main() {
  // Check for --print-config flag
  if (process.argv.includes("--print-config")) {
    const config = {
      mcpServers: {
        MonadBlitzButler: {
          command: "npx",
          args: ["monad-blitz-butler-mcp"],
          env: {
            OPENAI_API_KEY: "<your-openai-api-key>",
            TAVILY_API_KEY: "<your-tavily-api-key>",
            GOOGLE_PLACES_API_KEY: "<your-google-places-api-key>",
            VAPI_SECRET_KEY: "<your-vapi-secret-key>",
          },
        },
      },
    };
    console.log(JSON.stringify(config, null, 2));
    process.exit(0);
  }

  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Monad Blitz Butler MCP server running on stdio");
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
