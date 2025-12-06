import { RealtimeAgent, tool } from '@openai/agents/realtime';
import { getBalance, spendBalance } from './butler';

export const searchAgent = new RealtimeAgent({
  name: 'search',
  voice: 'shimmer',
  handoffDescription:
    'Handles paid operations including web searches (1 USDC) and API calls (0.50 USDC) for weather, stocks, news, and crypto data.',

  instructions: `You are the Search & API Agent for Blitz Butler.

You handle all paid operations:
- Web searches: 1 USDC per search
- API calls: 0.50 USDC per call (weather, stocks, news, crypto)

IMPORTANT:
1. Always check balance before making paid calls
2. Tell the user the cost before executing
3. If insufficient funds, explain and suggest depositing more
4. After each paid action, report the cost and remaining balance

When operations are complete, hand back to the main butler agent.`,

  tools: [
    tool({
      name: 'paidSearch',
      description: 'Perform a paid web search. Costs 1 USDC.',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'The search query',
          },
        },
        required: ['query'],
        additionalProperties: false,
      },
      execute: async (input: any) => {
        const { query } = input as { query: string };
        const cost = 1;
        const balance = getBalance();

        if (balance < cost) {
          return {
            success: false,
            error: '402 Payment Required',
            message: `Insufficient funds. Need ${cost} USDC, have ${balance} USDC. Please deposit more funds.`,
            required: cost,
            available: balance,
          };
        }

        const result = spendBalance(cost);
        if (!result.success) {
          return result;
        }

        // Simulate search results
        return {
          success: true,
          query,
          cost,
          newBalance: result.newBalance,
          results: [
            { title: `Top result for "${query}"`, snippet: 'Comprehensive information about your query...' },
            { title: `${query} - Latest News`, snippet: 'Recent developments and updates...' },
            { title: `Understanding ${query}`, snippet: 'In-depth analysis and insights...' },
          ],
        };
      },
    }),

    tool({
      name: 'paidApiCall',
      description: 'Make a paid API call. Costs 0.50 USDC. Available services: weather, stocks, news, crypto.',
      parameters: {
        type: 'object',
        properties: {
          service: {
            type: 'string',
            enum: ['weather', 'stocks', 'news', 'crypto'],
            description: 'The service to call',
          },
          params: {
            type: 'string',
            description: 'Parameters for the API call (e.g., city name, stock symbol)',
          },
        },
        required: ['service'],
        additionalProperties: false,
      },
      execute: async (input: any) => {
        const { service, params } = input as { service: string; params?: string };
        const cost = 0.5;
        const balance = getBalance();

        if (balance < cost) {
          return {
            success: false,
            error: '402 Payment Required',
            message: `Insufficient funds. Need ${cost} USDC, have ${balance} USDC. Please deposit more funds.`,
            required: cost,
            available: balance,
          };
        }

        const result = spendBalance(cost);
        if (!result.success) {
          return result;
        }

        // Simulate API responses
        const responses: Record<string, object> = {
          weather: {
            location: params || 'New York',
            temperature: '72°F',
            condition: 'Partly Cloudy',
            humidity: '45%',
            forecast: 'Clear skies expected this evening',
          },
          stocks: {
            symbol: params || 'AAPL',
            price: '$178.50',
            change: '+2.3%',
            volume: '52.4M',
            marketCap: '$2.8T',
          },
          news: {
            topic: params || 'technology',
            headlines: [
              'AI continues to transform industries worldwide',
              'New blockchain developments announced at major conference',
              'Tech stocks show strong Q4 performance',
            ],
          },
          crypto: {
            asset: params || 'ETH',
            price: '$3,450.00',
            change24h: '+5.2%',
            marketCap: '$415B',
            volume24h: '$18.5B',
          },
        };

        return {
          success: true,
          service,
          params: params || 'default',
          cost,
          newBalance: result.newBalance,
          timestamp: new Date().toISOString(),
          data: responses[service] || { error: 'Unknown service' },
        };
      },
    }),

    tool({
      name: 'estimateCost',
      description: 'Estimate the cost of an operation before executing it',
      parameters: {
        type: 'object',
        properties: {
          operation: {
            type: 'string',
            enum: ['search', 'weather', 'stocks', 'news', 'crypto'],
            description: 'The operation to estimate',
          },
        },
        required: ['operation'],
        additionalProperties: false,
      },
      execute: async (input: any) => {
        const { operation } = input as { operation: string };
        const costs: Record<string, number> = {
          search: 1.0,
          weather: 0.5,
          stocks: 0.5,
          news: 0.5,
          crypto: 0.5,
        };
        const balance = getBalance();
        const cost = costs[operation] || 0;

        return {
          operation,
          cost,
          currency: 'USDC',
          currentBalance: balance,
          canAfford: balance >= cost,
          shortfall: balance < cost ? cost - balance : 0,
        };
      },
    }),
  ],

  handoffs: [],
});
