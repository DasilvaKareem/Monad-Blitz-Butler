import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { getBalance, spendBalance } from "@/lib/balanceStore";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const AGENT_WALLET = process.env.AGENT_WALLET_ADDRESS!;

// Tool definitions for the agent
const tools: OpenAI.Chat.Completions.ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "check_balance",
      description: "Check the current balance of the agent wallet",
      parameters: {
        type: "object",
        properties: {},
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "paid_search",
      description: "Perform a paid search query. Costs 1 USDC per search. Use this when user wants to search for information.",
      parameters: {
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
  },
  {
    type: "function",
    function: {
      name: "paid_api_call",
      description: "Make a paid API call to an external service. Costs 0.50 USDC per call.",
      parameters: {
        type: "object",
        properties: {
          service: {
            type: "string",
            description: "The service to call (e.g., 'weather', 'stocks', 'news')",
          },
          params: {
            type: "string",
            description: "Parameters for the API call",
          },
        },
        required: ["service"],
      },
    },
  },
];

// Execute tool calls
async function executeTool(name: string, args: Record<string, unknown>): Promise<string> {
  switch (name) {
    case "check_balance": {
      const balance = getBalance(AGENT_WALLET);
      return JSON.stringify({ balance, wallet: AGENT_WALLET });
    }

    case "paid_search": {
      const cost = 1;
      const balance = getBalance(AGENT_WALLET);

      if (balance < cost) {
        return JSON.stringify({
          error: "402 Payment Required",
          message: `Insufficient funds. Need ${cost} USDC, have ${balance} USDC`,
          required: cost,
          available: balance,
        });
      }

      // Deduct balance (x402 simulation)
      spendBalance(AGENT_WALLET, cost);

      // Simulate search results
      const query = args.query as string;
      return JSON.stringify({
        success: true,
        cost,
        newBalance: getBalance(AGENT_WALLET),
        results: [
          { title: `Result 1 for "${query}"`, snippet: "This is a simulated search result..." },
          { title: `Result 2 for "${query}"`, snippet: "Another relevant finding..." },
          { title: `Result 3 for "${query}"`, snippet: "More information about your query..." },
        ],
      });
    }

    case "paid_api_call": {
      const cost = 0.5;
      const balance = getBalance(AGENT_WALLET);

      if (balance < cost) {
        return JSON.stringify({
          error: "402 Payment Required",
          message: `Insufficient funds. Need ${cost} USDC, have ${balance} USDC`,
          required: cost,
          available: balance,
        });
      }

      // Deduct balance (x402 simulation)
      spendBalance(AGENT_WALLET, cost);

      const service = args.service as string;
      return JSON.stringify({
        success: true,
        cost,
        newBalance: getBalance(AGENT_WALLET),
        service,
        data: {
          message: `Successfully called ${service} API`,
          timestamp: new Date().toISOString(),
          result: `Simulated ${service} data response`,
        },
      });
    }

    default:
      return JSON.stringify({ error: "Unknown tool" });
  }
}

const SYSTEM_PROMPT = `You are Blitz Butler, an AI agent with a real cryptocurrency wallet on Monad blockchain.

IMPORTANT RULES:
1. You have access to real funds in your wallet. Always check your balance before making paid actions.
2. NEVER make a paid tool call without first checking if you have sufficient funds.
3. If a user asks you to do something that costs money, tell them the cost BEFORE doing it.
4. If you have insufficient funds, clearly explain this to the user and ask them to deposit more.
5. After each paid action, report the cost and remaining balance.

AVAILABLE TOOLS:
- check_balance: Check your current wallet balance (free)
- paid_search: Search for information (costs 1 USDC)
- paid_api_call: Call external APIs (costs 0.50 USDC)

Be helpful, but be responsible with spending. You are demonstrating that AI agents can have real economic agency.`;

export async function POST(request: NextRequest) {
  try {
    const { message, conversationHistory = [] } = await request.json();

    if (!message) {
      return NextResponse.json({ error: "Message required" }, { status: 400 });
    }

    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      { role: "system", content: SYSTEM_PROMPT },
      ...conversationHistory,
      { role: "user", content: message },
    ];

    // Initial completion
    let response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages,
      tools,
      tool_choice: "auto",
    });

    let assistantMessage = response.choices[0].message;

    // Handle tool calls
    while (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
      // Add assistant message with tool calls
      messages.push(assistantMessage);

      // Execute each tool call
      for (const toolCall of assistantMessage.tool_calls) {
        if (toolCall.type !== "function") continue;
        const args = JSON.parse(toolCall.function.arguments);
        const result = await executeTool(toolCall.function.name, args);

        messages.push({
          role: "tool",
          tool_call_id: toolCall.id,
          content: result,
        });
      }

      // Get next response
      response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages,
        tools,
        tool_choice: "auto",
      });

      assistantMessage = response.choices[0].message;
    }

    // Get final balance
    const finalBalance = getBalance(AGENT_WALLET);

    return NextResponse.json({
      response: assistantMessage.content,
      balance: finalBalance,
      agentWallet: AGENT_WALLET,
    });
  } catch (error) {
    console.error("Agent error:", error);
    return NextResponse.json(
      { error: "Agent request failed", details: String(error) },
      { status: 500 }
    );
  }
}
