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

You can help users find food, search the web, get info, and place orders.

USER PREFERENCES (check context.userPreferences):
- The user may have set their location, dietary restrictions, allergies, cuisine preferences, and price range
- ALWAYS respect food allergies - NEVER suggest foods containing their allergens
- Prioritize their dietary preferences (vegan, vegetarian, gluten-free, halal, kosher, etc.)
- Use their location when searching for restaurants
- Filter by their preferred cuisines and price range when applicable
- If they have preferences set, mention that you're using them when searching

x402 PRICING (all services require payment):
- Phone calls: 0.1 USDC per call
- Web searches: 0.5 USDC per search
- Place orders: 1 USDC service fee + food cost + tax + delivery fees
- DoorDash delivery: delivery estimate in USDC
- Finding restaurants: FREE
- Viewing menus: FREE
- Check balance: FREE

WHAT YOU CAN DO:
1. Search for restaurants using Google Places (FREE)
2. Look up menus on restaurant websites (FREE)
3. Help users decide what to order (FREE)
4. Place food orders (PAID - 1 USDC + food cost)
5. Check wallet balance (FREE)
6. Web search for anything (PAID - 0.5 USDC)
7. Call businesses on behalf of the user (PAID - 0.1 USDC)
8. Request DoorDash delivery for orders (PAID - delivery fee applies)

DOORDASH DELIVERY FLOW - IMPORTANT:
When a user wants DoorDash delivery, you MUST follow this confirmation flow:
1. First, call requestDeliveryQuote to show them the delivery details and estimated fee
2. Present the quote clearly: show pickup location, dropoff address, estimated fee, and delivery time
3. Ask the user to confirm: "Would you like me to proceed with this delivery?"
4. Wait for explicit user confirmation ("yes", "confirm", "proceed", "go ahead", etc.)
5. ONLY after confirmation, call confirmDelivery with the quoteId to actually dispatch the Dasher
NEVER skip the confirmation step. Always show the quote first and wait for user approval.

When users want to find food or restaurants, use the findRestaurants tool directly.
When they want menu details, use getMenuDetails with the restaurant website.
When they confirm an order, use placeOrder (this charges their balance).
When users want to call a business, use callBusiness with the phone number and purpose.
When users want delivery, use requestDeliveryQuote first, then confirmDelivery after approval.

Be helpful and proactive. Don't ask about costs for searches - they're free!`,

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

    tool({
      name: 'findRestaurants',
      description: 'Search for restaurants and food places nearby. FREE. Returns name, rating, price, website, phone, and hours.',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'What to search for (e.g., "pizza", "chinese food", "sushi near me", "vegetarian in San Francisco")',
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
      name: 'webSearch',
      description: 'Perform a web search. PAID - costs 0.5 USDC per search.',
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
        const SEARCH_COST = 0.5;
        const balance = getBalance();

        // Check balance before searching
        if (balance < SEARCH_COST) {
          return {
            success: false,
            error: '402 Payment Required',
            message: `Insufficient funds. Web search costs ${SEARCH_COST} USDC, but you only have ${balance} USDC. Please deposit more funds.`,
            required: SEARCH_COST,
            available: balance,
          };
        }

        try {
          const searchResponse = await fetch(`/api/web-search?q=${encodeURIComponent(query)}`);
          const searchData = await searchResponse.json();

          // Charge for the search
          const result = spendBalance(SEARCH_COST);

          return {
            success: true,
            query,
            results: searchData.results || [],
            cost: SEARCH_COST,
            newBalance: result.newBalance,
            message: `💰 Charged ${SEARCH_COST} USDC for web search. New balance: ${result.newBalance} USDC`,
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
      name: 'placeOrder',
      description: 'Place a food order. PAID - costs 1 USDC service fee + food cost + tax + delivery. Include detailed item breakdown with prices.',
      parameters: {
        type: 'object',
        properties: {
          restaurant: {
            type: 'string',
            description: 'Name of the restaurant',
          },
          items: {
            type: 'array',
            description: 'Array of items with name, price, quantity',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                price: { type: 'number' },
                quantity: { type: 'number' },
              },
            },
          },
          subtotal: {
            type: 'number',
            description: 'Subtotal before fees',
          },
          deliveryFee: {
            type: 'number',
            description: 'Delivery fee (0 for pickup)',
          },
          tax: {
            type: 'number',
            description: 'Tax amount',
          },
          tip: {
            type: 'number',
            description: 'Tip amount',
          },
          totalCost: {
            type: 'number',
            description: 'Total cost in USDC',
          },
          deliveryAddress: {
            type: 'string',
            description: 'Delivery address (leave empty for pickup)',
          },
        },
        required: ['restaurant', 'items', 'totalCost'],
        additionalProperties: false,
      },
      execute: async (input: any) => {
        const { restaurant, items, subtotal, deliveryFee, tax, tip, totalCost, deliveryAddress } = input as {
          restaurant: string;
          items: Array<{ name: string; price: number; quantity?: number }>;
          subtotal?: number;
          deliveryFee?: number;
          tax?: number;
          tip?: number;
          totalCost: number;
          deliveryAddress?: string;
        };

        const SERVICE_FEE = 1.0; // x402 service fee
        const balance = getBalance();

        // Calculate subtotal from items if not provided
        const calcSubtotal = subtotal || items.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);
        const calcTax = tax || (calcSubtotal * 0.0875);
        const calcDeliveryFee = deliveryAddress ? (deliveryFee || 4.99) : 0;
        const platformFee = deliveryAddress ? 1.99 : 0;

        // Total includes x402 service fee
        const totalWithServiceFee = totalCost + SERVICE_FEE;

        if (balance < totalWithServiceFee) {
          return {
            success: false,
            error: '402 Payment Required',
            message: `Insufficient funds. Order costs ${totalCost} USDC + ${SERVICE_FEE} USDC service fee = ${totalWithServiceFee} USDC total, but you only have ${balance} USDC. Please deposit more funds.`,
            required: totalWithServiceFee,
            available: balance,
            restaurant,
            items: items.map(i => ({ ...i, quantity: i.quantity || 1 })),
            subtotal: calcSubtotal,
            deliveryFee: calcDeliveryFee,
            platformFee,
            serviceFee: SERVICE_FEE,
            tax: calcTax,
            tip: tip || 0,
            orderCost: totalCost,
            totalCost: totalWithServiceFee,
            deliveryAddress,
          };
        }

        const result = spendBalance(totalWithServiceFee);
        if (!result.success) {
          return result;
        }

        return {
          success: true,
          orderId: `ORD-${Date.now()}`,
          restaurant,
          items: items.map(i => ({ ...i, quantity: i.quantity || 1 })),
          subtotal: calcSubtotal,
          deliveryFee: calcDeliveryFee,
          platformFee,
          serviceFee: SERVICE_FEE,
          tax: calcTax,
          tip: tip || 0,
          orderCost: totalCost,
          totalCost: totalWithServiceFee,
          newBalance: result.newBalance,
          deliveryAddress: deliveryAddress || null,
          estimatedDelivery: deliveryAddress ? '30-45 minutes' : '15-20 minutes (pickup)',
          message: `Order placed successfully! 💰 Charged ${totalWithServiceFee} USDC (${totalCost} order + ${SERVICE_FEE} service fee). New balance: ${result.newBalance} USDC`,
        };
      },
    }),

    tool({
      name: 'callBusiness',
      description: 'Call a business on behalf of the user using AI voice. PAID - costs 0.1 USDC per call. Great for making reservations, asking about hours, checking availability, or any phone inquiry.',
      parameters: {
        type: 'object',
        properties: {
          phoneNumber: {
            type: 'string',
            description: 'The phone number to call (e.g., "+1-555-123-4567" or "555-123-4567")',
          },
          businessName: {
            type: 'string',
            description: 'Name of the business being called',
          },
          purpose: {
            type: 'string',
            description: 'What to ask or accomplish on the call (e.g., "Make a reservation for 2 people at 7pm tonight", "Ask about current wait time", "Check if they have outdoor seating")',
          },
        },
        required: ['phoneNumber', 'purpose'],
        additionalProperties: false,
      },
      execute: async (input: any) => {
        const { phoneNumber, businessName, purpose } = input as {
          phoneNumber: string;
          businessName?: string;
          purpose: string;
        };

        const CALL_COST = 0.1;
        const balance = getBalance();

        // Check balance before calling
        if (balance < CALL_COST) {
          return {
            success: false,
            error: '402 Payment Required',
            message: `Insufficient funds. Phone call costs ${CALL_COST} USDC, but you only have ${balance} USDC. Please deposit more funds.`,
            required: CALL_COST,
            available: balance,
          };
        }

        try {
          const response = await fetch('/api/vapi-call', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              phoneNumber,
              businessName,
              message: purpose,
            }),
          });

          const data = await response.json();

          if (!response.ok) {
            return {
              success: false,
              error: data.error || 'Failed to initiate call',
              details: data.details,
            };
          }

          // Charge for the call
          const result = spendBalance(CALL_COST);

          const demoMessage = data.demoMode
            ? `🧪 TEST MODE: Call forwarded to admin number.\n   Would call: ${phoneNumber}${businessName ? ` (${businessName})` : ''}`
            : `📞 CALLING: ${phoneNumber}${businessName ? ` (${businessName})` : ''}`;

          return {
            success: true,
            callId: data.callId,
            status: data.status,
            businessName: businessName || 'Unknown business',
            phoneNumber,
            purpose,
            demoMode: data.demoMode,
            cost: CALL_COST,
            newBalance: result.newBalance,
            message: `${demoMessage}\nPurpose: ${purpose}\nCall ID: ${data.callId}\nStatus: ${data.status}\n💰 Charged ${CALL_COST} USDC. New balance: ${result.newBalance} USDC`,
          };
        } catch (error) {
          return {
            success: false,
            error: 'Failed to make call',
            details: String(error),
          };
        }
      },
    }),

    tool({
      name: 'getCallStatus',
      description: 'Check the status of a previously initiated phone call. FREE.',
      parameters: {
        type: 'object',
        properties: {
          callId: {
            type: 'string',
            description: 'The call ID returned from callBusiness',
          },
        },
        required: ['callId'],
        additionalProperties: false,
      },
      execute: async (input: any) => {
        const { callId } = input as { callId: string };

        try {
          const response = await fetch(`/api/vapi-call?callId=${callId}`);
          const data = await response.json();

          if (!response.ok) {
            return {
              success: false,
              error: data.error || 'Failed to get call status',
            };
          }

          return {
            success: true,
            callId: data.callId,
            status: data.status,
            duration: data.duration,
            transcript: data.transcript,
            summary: data.summary,
            message: `Call status: ${data.status}${data.summary ? `. Summary: ${data.summary}` : ''}`,
          };
        } catch (error) {
          return {
            success: false,
            error: 'Failed to get call status',
            details: String(error),
          };
        }
      },
    }),

    // DoorDash Delivery Tools
    tool({
      name: 'requestDeliveryQuote',
      description: 'Request a DoorDash delivery quote. Shows estimated fee and delivery time. ALWAYS use this first before confirming delivery. Returns a quoteId needed for confirmation.',
      parameters: {
        type: 'object',
        properties: {
          pickupAddress: {
            type: 'string',
            description: 'Full street address for pickup (restaurant address)',
          },
          pickupBusinessName: {
            type: 'string',
            description: 'Name of the restaurant/business for pickup',
          },
          pickupPhoneNumber: {
            type: 'string',
            description: 'Phone number for pickup location',
          },
          pickupInstructions: {
            type: 'string',
            description: 'Special instructions for pickup (optional)',
          },
          dropoffAddress: {
            type: 'string',
            description: 'Full street address for delivery (customer address)',
          },
          dropoffPhoneNumber: {
            type: 'string',
            description: 'Customer phone number for delivery updates',
          },
          dropoffInstructions: {
            type: 'string',
            description: 'Special delivery instructions (optional, e.g., "Leave at door", "Call when arriving")',
          },
          orderValue: {
            type: 'number',
            description: 'Total order value in dollars (used for insurance)',
          },
          tipAmount: {
            type: 'number',
            description: 'Tip amount in dollars for the Dasher (optional)',
          },
        },
        required: ['pickupAddress', 'pickupBusinessName', 'pickupPhoneNumber', 'dropoffAddress', 'dropoffPhoneNumber', 'orderValue'],
        additionalProperties: false,
      },
      execute: async (input: any) => {
        const {
          pickupAddress,
          pickupBusinessName,
          pickupPhoneNumber,
          pickupInstructions,
          dropoffAddress,
          dropoffPhoneNumber,
          dropoffInstructions,
          orderValue,
          tipAmount,
        } = input as {
          pickupAddress: string;
          pickupBusinessName: string;
          pickupPhoneNumber: string;
          pickupInstructions?: string;
          dropoffAddress: string;
          dropoffPhoneNumber: string;
          dropoffInstructions?: string;
          orderValue: number;
          tipAmount?: number;
        };

        // Generate a quote ID for this request (will be used to confirm)
        const quoteId = `quote-${Date.now()}-${Math.random().toString(36).substring(7)}`;

        // Store the quote details in memory for confirmation
        // In sandbox mode, we simulate the quote response
        const estimatedFee = 5.99 + (tipAmount || 0); // Base delivery fee + tip
        const estimatedPickupTime = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 min from now
        const estimatedDropoffTime = new Date(Date.now() + 45 * 60 * 1000).toISOString(); // 45 min from now

        // Store quote data globally so confirmDelivery can access it
        (globalThis as any).__pendingDeliveryQuotes = (globalThis as any).__pendingDeliveryQuotes || {};
        (globalThis as any).__pendingDeliveryQuotes[quoteId] = {
          pickupAddress,
          pickupBusinessName,
          pickupPhoneNumber,
          pickupInstructions,
          dropoffAddress,
          dropoffPhoneNumber,
          dropoffInstructions,
          orderValue: Math.round(orderValue * 100), // Convert to cents for API
          tip: Math.round((tipAmount || 0) * 100),
          estimatedFee,
          createdAt: Date.now(),
        };

        return {
          success: true,
          quoteId,
          requiresConfirmation: true,
          pickup: {
            address: pickupAddress,
            businessName: pickupBusinessName,
            phone: pickupPhoneNumber,
            instructions: pickupInstructions || 'None',
          },
          dropoff: {
            address: dropoffAddress,
            phone: dropoffPhoneNumber,
            instructions: dropoffInstructions || 'None',
          },
          orderValue: `$${orderValue.toFixed(2)}`,
          estimatedDeliveryFee: `$${estimatedFee.toFixed(2)}`,
          estimatedPickupTime: new Date(estimatedPickupTime).toLocaleTimeString(),
          estimatedDropoffTime: new Date(estimatedDropoffTime).toLocaleTimeString(),
          message: `DELIVERY QUOTE READY\n\nPickup: ${pickupBusinessName}\n${pickupAddress}\n\nDeliver to: ${dropoffAddress}\n\nEstimated Fee: $${estimatedFee.toFixed(2)}\nEstimated Delivery: ${new Date(estimatedDropoffTime).toLocaleTimeString()}\n\nCONFIRMATION REQUIRED: Please confirm to dispatch a Dasher.`,
        };
      },
    }),

    tool({
      name: 'confirmDelivery',
      description: 'Confirm and dispatch a DoorDash delivery. ONLY use this after the user has explicitly confirmed they want to proceed with the delivery quote. Requires the quoteId from requestDeliveryQuote.',
      parameters: {
        type: 'object',
        properties: {
          quoteId: {
            type: 'string',
            description: 'The quote ID returned from requestDeliveryQuote',
          },
        },
        required: ['quoteId'],
        additionalProperties: false,
      },
      execute: async (input: any) => {
        const { quoteId } = input as { quoteId: string };

        // Retrieve the stored quote
        const pendingQuotes = (globalThis as any).__pendingDeliveryQuotes || {};
        const quote = pendingQuotes[quoteId];

        if (!quote) {
          return {
            success: false,
            error: 'Quote not found or expired',
            message: 'The delivery quote was not found. Please request a new quote using requestDeliveryQuote.',
          };
        }

        // Check if quote is expired (30 minutes)
        if (Date.now() - quote.createdAt > 30 * 60 * 1000) {
          delete pendingQuotes[quoteId];
          return {
            success: false,
            error: 'Quote expired',
            message: 'The delivery quote has expired. Please request a new quote.',
          };
        }

        // Check balance for delivery fee
        const balance = getBalance();
        if (balance < quote.estimatedFee) {
          return {
            success: false,
            error: '402 Payment Required',
            message: `Insufficient funds. Delivery costs $${quote.estimatedFee.toFixed(2)} USDC, but you only have ${balance} USDC. Please deposit more funds.`,
            required: quote.estimatedFee,
            available: balance,
          };
        }

        try {
          const response = await fetch('/api/doordash-delivery', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              pickupAddress: quote.pickupAddress,
              pickupBusinessName: quote.pickupBusinessName,
              pickupPhoneNumber: quote.pickupPhoneNumber,
              pickupInstructions: quote.pickupInstructions,
              dropoffAddress: quote.dropoffAddress,
              dropoffPhoneNumber: quote.dropoffPhoneNumber,
              dropoffInstructions: quote.dropoffInstructions,
              orderValue: quote.orderValue,
              tip: quote.tip,
            }),
          });

          const data = await response.json();

          // Clean up the used quote
          delete pendingQuotes[quoteId];

          if (!response.ok) {
            return {
              success: false,
              error: data.error || 'Failed to create delivery',
              details: data.details,
              message: `Failed to dispatch Dasher: ${data.message || data.error}`,
            };
          }

          // Charge for the delivery
          const chargeResult = spendBalance(quote.estimatedFee);

          return {
            success: true,
            deliveryId: data.deliveryId,
            trackingUrl: data.trackingUrl,
            status: data.status,
            fee: data.fee,
            estimatedPickupTime: data.estimatedPickupTime,
            estimatedDropoffTime: data.estimatedDropoffTime,
            supportReference: data.supportReference,
            cost: quote.estimatedFee,
            newBalance: chargeResult.newBalance,
            message: `DELIVERY CONFIRMED!\n\nDelivery ID: ${data.deliveryId}\nStatus: ${data.status}\n\nTrack your delivery: ${data.trackingUrl}\n\nA Dasher will pick up your order shortly.\n\nCharged $${quote.estimatedFee.toFixed(2)} USDC. New balance: ${chargeResult.newBalance} USDC`,
          };
        } catch (error) {
          return {
            success: false,
            error: 'Failed to confirm delivery',
            details: String(error),
          };
        }
      },
    }),

    tool({
      name: 'getDeliveryStatus',
      description: 'Check the status of an active DoorDash delivery. FREE.',
      parameters: {
        type: 'object',
        properties: {
          deliveryId: {
            type: 'string',
            description: 'The delivery ID returned from confirmDelivery',
          },
        },
        required: ['deliveryId'],
        additionalProperties: false,
      },
      execute: async (input: any) => {
        const { deliveryId } = input as { deliveryId: string };

        try {
          const response = await fetch(`/api/doordash-delivery?deliveryId=${deliveryId}`);
          const data = await response.json();

          if (!response.ok) {
            return {
              success: false,
              error: data.error || 'Failed to get delivery status',
            };
          }

          const statusMessages: Record<string, string> = {
            created: 'Delivery created, waiting for Dasher',
            confirmed: 'Dasher confirmed',
            enroute_to_pickup: 'Dasher heading to restaurant',
            arrived_at_pickup: 'Dasher arrived at restaurant',
            picked_up: 'Order picked up, on the way!',
            enroute_to_dropoff: 'Dasher heading to you',
            arrived_at_dropoff: 'Dasher arrived!',
            delivered: 'Delivered!',
            cancelled: 'Delivery cancelled',
          };

          return {
            success: true,
            deliveryId: data.deliveryId,
            status: data.status,
            statusMessage: statusMessages[data.status] || data.status,
            trackingUrl: data.trackingUrl,
            dasherName: data.dasherName,
            dasherPhone: data.dasherPhoneNumber,
            estimatedDropoffTime: data.estimatedDropoffTime,
            actualDropoffTime: data.actualDropoffTime,
            message: `${statusMessages[data.status] || data.status}\n\nDelivery ID: ${data.deliveryId}${data.dasherName ? `\nDasher: ${data.dasherName}` : ''}${data.trackingUrl ? `\n\nTrack: ${data.trackingUrl}` : ''}`,
          };
        } catch (error) {
          return {
            success: false,
            error: 'Failed to get delivery status',
            details: String(error),
          };
        }
      },
    }),

    tool({
      name: 'cancelDelivery',
      description: 'Cancel an active DoorDash delivery. Only works before pickup.',
      parameters: {
        type: 'object',
        properties: {
          deliveryId: {
            type: 'string',
            description: 'The delivery ID to cancel',
          },
        },
        required: ['deliveryId'],
        additionalProperties: false,
      },
      execute: async (input: any) => {
        const { deliveryId } = input as { deliveryId: string };

        try {
          const response = await fetch(`/api/doordash-delivery?deliveryId=${deliveryId}`, {
            method: 'DELETE',
          });
          const data = await response.json();

          if (!response.ok) {
            return {
              success: false,
              error: data.error || 'Failed to cancel delivery',
              details: data.details,
            };
          }

          return {
            success: true,
            deliveryId: data.deliveryId,
            status: data.status,
            message: 'Delivery cancelled successfully.',
          };
        } catch (error) {
          return {
            success: false,
            error: 'Failed to cancel delivery',
            details: String(error),
          };
        }
      },
    }),
  ],

  handoffs: [],
});
