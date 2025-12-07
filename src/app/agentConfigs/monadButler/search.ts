import { RealtimeAgent, tool } from '@openai/agents/realtime';
import { getBalance, spendBalance } from './butler';

export const searchAgent = new RealtimeAgent({
  name: 'search',
  voice: 'shimmer',
  handoffDescription:
    'Handles paid operations including web searches (1 USDC) and API calls (0.50 USDC) for weather, stocks, news, and crypto data.',

  instructions: `You are the Search & API Agent for Blitz Butler.

You handle operations including:
- Web searches (FREE)
- API calls for weather, stocks, news, crypto (FREE)
- Restaurant/food search (FREE)
- Menu lookups (FREE)
- PLACING ORDERS: This is the ONLY paid action - costs vary by order

FOOD ORDERING FLOW:
1. Use findRestaurants to search for places near the user (free)
2. Share the results with names, ratings, prices, and websites
3. If user wants menu details, use getMenuDetails with the restaurant's website (free)
4. Help user decide what to order based on menu info
5. When they're ready to place an order, use placeOrder (PAID - costs money from balance)

When operations are complete, hand back to the main butler agent.`,

  tools: [
    tool({
      name: 'webSearch',
      description: 'Perform a web search. FREE.',
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

        try {
          const searchResponse = await fetch(`/api/web-search?q=${encodeURIComponent(query)}`);
          const searchData = await searchResponse.json();

          if (searchData.error) {
            return {
              success: false,
              query,
              error: searchData.error,
            };
          }

          return {
            success: true,
            query,
            results: searchData.results || [],
          };
        } catch (error) {
          return {
            success: false,
            query,
            error: 'Search failed',
          };
        }
      },
    }),

    tool({
      name: 'apiCall',
      description: 'Make an API call. FREE. Available services: weather, stocks, news, crypto.',
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
          timestamp: new Date().toISOString(),
          data: responses[service] || { error: 'Unknown service' },
        };
      },
    }),

    tool({
      name: 'findRestaurants',
      description: 'Search for restaurants and food places nearby. FREE. Returns name, rating, price, website, phone, and hours.',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'What to search for (e.g., "pizza", "chinese food", "sushi near me")',
          },
          location: {
            type: 'string',
            description: 'Location as "latitude,longitude" or leave empty for default',
          },
        },
        required: ['query'],
        additionalProperties: false,
      },
      execute: async (input: any) => {
        const { query, location } = input as { query: string; location?: string };

        try {
          const url = `/api/places?q=${encodeURIComponent(query)}${location ? `&location=${location}` : ''}`;
          const response = await fetch(url);
          const data = await response.json();

          return {
            success: true,
            query,
            restaurants: data.results || [],
          };
        } catch (error) {
          return {
            success: false,
            query,
            error: 'Failed to search restaurants',
          };
        }
      },
    }),

    tool({
      name: 'getMenuDetails',
      description: 'Scrape a restaurant website for menu information, prices, and ordering links. FREE.',
      parameters: {
        type: 'object',
        properties: {
          website: {
            type: 'string',
            description: 'The restaurant website URL to scrape for menu details',
          },
        },
        required: ['website'],
        additionalProperties: false,
      },
      execute: async (input: any) => {
        const { website } = input as { website: string };

        try {
          const url = `/api/menu-scrape?website=${encodeURIComponent(website)}`;
          const response = await fetch(url);
          const data = await response.json();

          return {
            success: true,
            website,
            menuLinks: data.menuLinks || [],
            pricesFound: data.pricesFound || [],
            foodCategories: data.foodCategories || [],
            menuItems: data.menuItems || [],
            note: data.note,
          };
        } catch (error) {
          return {
            success: false,
            website,
            error: 'Failed to scrape menu',
          };
        }
      },
    }),

    tool({
      name: 'placeOrder',
      description: 'Place a food order. PAID - costs the price of the order. This is the only tool that charges money.',
      parameters: {
        type: 'object',
        properties: {
          restaurant: {
            type: 'string',
            description: 'Name of the restaurant',
          },
          items: {
            type: 'string',
            description: 'Items to order (comma separated)',
          },
          totalCost: {
            type: 'number',
            description: 'Total cost of the order in USDC',
          },
          deliveryAddress: {
            type: 'string',
            description: 'Delivery address',
          },
        },
        required: ['restaurant', 'items', 'totalCost'],
        additionalProperties: false,
      },
      execute: async (input: any) => {
        const { restaurant, items, totalCost, deliveryAddress } = input as {
          restaurant: string;
          items: string;
          totalCost: number;
          deliveryAddress?: string;
        };

        const balance = await getBalance();

        if (balance < totalCost) {
          return {
            success: false,
            error: '402 Payment Required',
            message: `Insufficient funds. Order costs ${totalCost} USDC, but you only have ${balance} USDC. Please deposit more funds.`,
            required: totalCost,
            available: balance,
          };
        }

        const result = await spendBalance(totalCost, `Order at ${restaurant}`);
        if (!result.success) {
          return result;
        }

        return {
          success: true,
          orderId: `ORD-${Date.now()}`,
          restaurant,
          items: items.split(',').map(i => i.trim()),
          totalCost,
          newBalance: result.newBalance,
          deliveryAddress: deliveryAddress || 'Pickup',
          estimatedDelivery: '30-45 minutes',
          message: `Order placed successfully! ${totalCost} USDC has been charged.`,
        };
      },
    }),
  ],

  handoffs: [],
});
