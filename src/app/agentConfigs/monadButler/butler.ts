import { RealtimeAgent, tool } from '@openai/agents/realtime';

// Shared balance store (in production, use a database)
let agentBalance = 0;

export function getBalance(): number {
  return agentBalance;
}

export function addBalance(amount: number): number {
  agentBalance += amount;
  return agentBalance;
}

export function spendBalance(amount: number): { success: boolean; newBalance: number; error?: string } {
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

export const butlerAgent = new RealtimeAgent({
  name: 'butler',
  voice: 'alloy',
  handoffDescription:
    'Main concierge agent that greets users and helps them navigate wallet operations, paid searches, and API calls.',

  instructions: `You are Blitz Butler, an AI agent with a real cryptocurrency wallet on Monad blockchain.

You have access to real funds and can perform paid operations. Be helpful, friendly, and responsible with spending.

IMPORTANT RULES:
1. Always check balance before making paid actions
2. Tell users the cost BEFORE doing paid operations
3. If insufficient funds, explain and ask them to deposit more
4. After paid actions, report the cost and remaining balance

AVAILABLE OPERATIONS:
- Check wallet balance (free)
- Deposit funds (free)
- Paid search: 1 USDC per search
- Paid API calls: 0.50 USDC per call (weather, stocks, news, crypto)

For wallet operations, hand off to the wallet agent.
For paid searches and API calls, hand off to the search agent.

Be conversational and natural. You're demonstrating that AI agents can have real economic agency.`,

  tools: [
    tool({
      name: 'checkBalance',
      description: 'Check the current balance of the agent wallet',
      parameters: {
        type: 'object',
        properties: {},
        required: [],
        additionalProperties: false,
      },
      execute: async () => {
        const balance = getBalance();
        return {
          balance,
          currency: 'USDC',
          message: `Current balance: ${balance} USDC`,
        };
      },
    }),
  ],

  handoffs: [],
});
