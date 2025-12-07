import { RealtimeAgent, tool } from '@openai/agents/realtime';

// Helper functions to interact with server-side balance API (exported for other agents)
export async function getBalance(): Promise<number> {
  try {
    const response = await fetch('/api/balance');
    const data = await response.json();
    return data.balance || 0;
  } catch (error) {
    console.error('Failed to get balance:', error);
    return 0;
  }
}

export async function addBalance(amount: number, userWallet?: string): Promise<number> {
  try {
    const response = await fetch('/api/deposit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount, userWallet: userWallet || 'anonymous' }),
    });
    const data = await response.json();
    return data.newBalance || 0;
  } catch (error) {
    console.error('Failed to add balance:', error);
    return 0;
  }
}

export async function spendBalance(amount: number, description?: string): Promise<{ success: boolean; newBalance: number; error?: string }> {
  try {
    const response = await fetch('/api/spend', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount, description }),
    });
    const data = await response.json();

    if (!response.ok || !data.success) {
      return {
        success: false,
        newBalance: data.available || 0,
        error: data.message || data.error || 'Payment failed',
      };
    }

    return { success: true, newBalance: data.newBalance };
  } catch (error) {
    console.error('Failed to spend balance:', error);
    return { success: false, newBalance: 0, error: 'Payment system error' };
  }
}

export const butlerAgent = new RealtimeAgent({
  name: 'butler',
  voice: 'onyx',
  handoffDescription:
    'Main concierge agent that greets users and helps them navigate wallet operations, paid searches, and API calls.',

  instructions: `You are Blitz Butler, an AI agent with a real cryptocurrency wallet on Monad blockchain.

You can help users find food, order groceries, search the web, get info, and place orders.

USER PREFERENCES (check context.userPreferences):
- The user may have set their location, dietary restrictions, allergies, cuisine preferences, and price range
- ALWAYS respect food allergies - NEVER suggest foods containing their allergens
- Prioritize their dietary preferences (vegan, vegetarian, gluten-free, halal, kosher, etc.)
- Use their location when searching for restaurants or groceries
- Filter by their preferred cuisines and price range when applicable
- If they have preferences set, mention that you're using them when searching

x402 PRICING (all services require payment in USDK - test stablecoin):
- Phone calls: 0.1 USDK per call
- Web searches: 0.5 USDK per search
- Menu image analysis (AI Vision): 0.25 USDK per image
- Place orders: 1 USDK service fee + food cost + tax + delivery fees
- GoPuff grocery orders: 1 USDK service fee + product cost
- DoorDash delivery: delivery estimate in USDK
- Finding restaurants: FREE
- Viewing menus: FREE
- Searching GoPuff products: FREE
- Check balance: FREE
- Fund agent wallet: FREE (for demo/testing)

FUNDING THE AGENT:
If balance is low, you can use the fundAgent tool to add USDK to the wallet for testing.
Just say "fund the agent with X USDK" or "add funds" and you'll top up the balance.

WHAT YOU CAN DO:
1. Search for restaurants using Google Places (FREE)
2. Look up menus on restaurant websites (FREE)
3. Analyze menu images with AI Vision to extract prices (PAID - 0.25 USDK)
4. Help users decide what to order (FREE)
5. Place food orders (PAID - 1 USDK + food cost)
6. Check wallet balance (FREE)
7. Fund the agent wallet with USDK (FREE - for demo)
8. Web search for anything (PAID - 0.5 USDK)
9. Call businesses on behalf of the user (PAID - 0.1 USDK)
10. Request DoorDash delivery for orders (PAID - delivery fee applies)

GOPUFF GROCERY SHOPPING (30-minute delivery!):
11. Search GoPuff products - snacks, drinks, groceries, household items (FREE)
12. Create a GoPuff cart and add items (FREE)
13. Place GoPuff orders with delivery (PAID - 1 USDK + product cost)
14. Get payment link for GoPuff checkout (payment handled by GoPuff/Stripe)

GOPUFF ORDERING FLOW:
1. Use searchGroceries to find products near the user's location
2. Products have location_id - you need this to create a cart
3. Use createGroceryCart with the location_id to start a cart
4. Use addToGroceryCart to add products (need cart_id and product_id)
5. Use placeGroceryOrder to submit the order with customer details
6. Use getGroceryPaymentLink to get a Stripe checkout link for payment
7. Once paid, GoPuff delivers in ~30 minutes!

MENU IMAGE ANALYSIS:
When getMenuDetails returns menu images, you can use analyzeMenuImage to extract exact prices.
This uses GPT-4 Vision to read the menu and return structured item names, descriptions, and prices.

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
When users want groceries, snacks, or quick delivery items, use searchGroceries for GoPuff products.

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
        const balance = await getBalance();
        return {
          balance,
          currency: 'USDK',
          message: `Current balance: ${balance} USDK`,
        };
      },
    }),

    tool({
      name: 'fundAgent',
      description: 'Fund the agent wallet with USDK (test stablecoin). Use this when balance is low or user wants to add funds for demo.',
      parameters: {
        type: 'object',
        properties: {
          amount: {
            type: 'number',
            description: 'Amount of USDK to add to the agent wallet',
          },
        },
        required: ['amount'],
        additionalProperties: false,
      },
      execute: async (input: any) => {
        const { amount } = input as { amount: number };

        if (amount <= 0 || amount > 1000) {
          return {
            success: false,
            error: 'Amount must be between 0 and 1000 USDK',
          };
        }

        try {
          const response = await fetch('/api/fund-agent', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ amount }),
          });

          const data = await response.json();

          if (!response.ok) {
            return {
              success: false,
              error: data.error || 'Failed to fund agent',
            };
          }

          return {
            success: true,
            funded: amount,
            newBalance: data.newBalance,
            message: `💰 Agent funded with ${amount} USDK! New balance: ${data.newBalance} USDK`,
          };
        } catch (error) {
          return {
            success: false,
            error: 'Failed to fund agent',
            details: String(error),
          };
        }
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
            images: data.images || [],
            mainImage: data.mainImage || null,
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
      name: 'analyzeMenuImage',
      description: 'Use AI vision to analyze a menu image and extract all items with prices. PAID - costs 0.25 USDC. Use this when you have a menu image URL to get accurate prices.',
      parameters: {
        type: 'object',
        properties: {
          imageUrl: {
            type: 'string',
            description: 'URL of the menu image to analyze',
          },
        },
        required: ['imageUrl'],
        additionalProperties: false,
      },
      execute: async (input: any) => {
        const { imageUrl } = input as { imageUrl: string };
        const VISION_COST = 0.25;
        const balance = await getBalance();

        if (balance < VISION_COST) {
          return {
            success: false,
            error: '402 Payment Required',
            message: `Insufficient funds. Menu image analysis costs ${VISION_COST} USDC, but you only have ${balance} USDC.`,
            required: VISION_COST,
            available: balance,
          };
        }

        try {
          const response = await fetch('/api/analyze-menu', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ imageUrl }),
          });

          const data = await response.json();

          if (!response.ok) {
            return {
              success: false,
              error: data.error || 'Failed to analyze menu image',
            };
          }

          // Charge for the analysis
          const result = await spendBalance(VISION_COST, 'Menu image analysis');

          return {
            success: true,
            restaurantName: data.restaurantName,
            menuItems: data.menuItems || [],
            categories: data.categories || [],
            currency: data.currency || 'USD',
            notes: data.notes,
            itemCount: data.itemCount,
            cost: VISION_COST,
            newBalance: result.newBalance,
            message: `📸 Analyzed menu image. Found ${data.itemCount} items. Charged ${VISION_COST} USDC.`,
          };
        } catch (error) {
          return {
            success: false,
            error: 'Failed to analyze menu image',
            details: String(error),
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
        const balance = await getBalance();

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
          const result = await spendBalance(SEARCH_COST, 'Web search');

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
        const balance = await getBalance();

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

        const result = await spendBalance(totalWithServiceFee, `Order at ${restaurant}`);
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
        const balance = await getBalance();

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
          const result = await spendBalance(CALL_COST, `Phone call to ${businessName || phoneNumber}`);

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
        const balance = await getBalance();
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
          const chargeResult = await spendBalance(quote.estimatedFee, 'DoorDash delivery');

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

    // ============ GOPUFF GROCERY SHOPPING TOOLS ============

    tool({
      name: 'searchGroceries',
      description: 'Search for grocery products on GoPuff. FREE. Returns products with prices, images, and location info. 30-minute delivery available!',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'What to search for (e.g., "chips", "energy drinks", "ice cream", "toilet paper")',
          },
          latitude: {
            type: 'number',
            description: 'Latitude of delivery location',
          },
          longitude: {
            type: 'number',
            description: 'Longitude of delivery location',
          },
          category: {
            type: 'string',
            description: 'Optional category filter (e.g., "Snacks", "Beverages", "Household")',
          },
        },
        required: ['query', 'latitude', 'longitude'],
        additionalProperties: false,
      },
      execute: async (input: any) => {
        const { query, latitude, longitude, category } = input as {
          query: string;
          latitude: number;
          longitude: number;
          category?: string;
        };

        try {
          const params = new URLSearchParams({
            query,
            latitude: String(latitude),
            longitude: String(longitude),
          });
          if (category) params.append('category', category);

          const response = await fetch(`/api/grocery/search?${params}`);
          const data = await response.json();

          if (!response.ok) {
            return {
              success: false,
              error: data.error || 'Failed to search products',
              details: data.details,
            };
          }

          return {
            success: true,
            query,
            products: data.products || [],
            location: data.location,
            message: `Found ${(data.products || []).length} products matching "${query}" on GoPuff`,
            note: 'Use the location_id and product_id to add items to cart',
          };
        } catch (error) {
          return {
            success: false,
            error: 'Failed to search groceries',
            details: String(error),
          };
        }
      },
    }),

    tool({
      name: 'createGroceryCart',
      description: 'Create a new GoPuff shopping cart for a specific location. FREE. Required before adding items.',
      parameters: {
        type: 'object',
        properties: {
          location_id: {
            type: 'string',
            description: 'The GoPuff location ID (from searchGroceries results)',
          },
        },
        required: ['location_id'],
        additionalProperties: false,
      },
      execute: async (input: any) => {
        const { location_id } = input as { location_id: string };

        try {
          const response = await fetch('/api/grocery/cart', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ location_id }),
          });

          const data = await response.json();

          if (!response.ok) {
            return {
              success: false,
              error: data.error || 'Failed to create cart',
              details: data.details,
            };
          }

          return {
            success: true,
            cartId: data.cartId,
            location_id,
            message: `Cart created! Cart ID: ${data.cartId}. Now you can add items.`,
          };
        } catch (error) {
          return {
            success: false,
            error: 'Failed to create cart',
            details: String(error),
          };
        }
      },
    }),

    tool({
      name: 'addToGroceryCart',
      description: 'Add a product to the GoPuff cart. FREE.',
      parameters: {
        type: 'object',
        properties: {
          cart_id: {
            type: 'string',
            description: 'The cart ID from createGroceryCart',
          },
          product_id: {
            type: 'string',
            description: 'The product ID from searchGroceries',
          },
          product_name: {
            type: 'string',
            description: 'Name of the product (for display)',
          },
          quantity: {
            type: 'number',
            description: 'Quantity to add (default 1)',
          },
        },
        required: ['cart_id', 'product_id', 'product_name'],
        additionalProperties: false,
      },
      execute: async (input: any) => {
        const { cart_id, product_id, product_name, quantity } = input as {
          cart_id: string;
          product_id: string;
          product_name: string;
          quantity?: number;
        };

        try {
          const response = await fetch('/api/grocery/cart/item', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              cart_id,
              product_id,
              product_name,
              quantity: quantity || 1,
            }),
          });

          const data = await response.json();

          if (!response.ok) {
            return {
              success: false,
              error: data.error || 'Failed to add item',
              details: data.details,
            };
          }

          return {
            success: true,
            cart_id,
            product_id,
            product_name,
            quantity: quantity || 1,
            message: `Added ${quantity || 1}x ${product_name} to cart`,
          };
        } catch (error) {
          return {
            success: false,
            error: 'Failed to add item to cart',
            details: String(error),
          };
        }
      },
    }),

    tool({
      name: 'placeGroceryOrder',
      description: 'Place a GoPuff grocery order. PAID - costs 1 USDK service fee. Creates order and returns payment link.',
      parameters: {
        type: 'object',
        properties: {
          location_id: {
            type: 'string',
            description: 'The GoPuff location ID',
          },
          items: {
            type: 'array',
            description: 'Array of items with product_id and quantity',
            items: {
              type: 'object',
              properties: {
                product_id: { type: 'string' },
                quantity: { type: 'number' },
              },
            },
          },
          customer_name: {
            type: 'string',
            description: 'Customer full name',
          },
          customer_email: {
            type: 'string',
            description: 'Customer email',
          },
          customer_phone: {
            type: 'string',
            description: 'Customer phone number (format: +12345678901)',
          },
          street_address: {
            type: 'string',
            description: 'Street address for delivery',
          },
          city: {
            type: 'string',
            description: 'City',
          },
          state: {
            type: 'string',
            description: 'State (2-letter code, e.g., NY, CA)',
          },
          zip: {
            type: 'string',
            description: 'ZIP/Postal code',
          },
          dropoff_instructions: {
            type: 'string',
            description: 'Delivery instructions (e.g., "Leave at door", "Call when arriving")',
          },
          tip: {
            type: 'number',
            description: 'Tip amount in dollars',
          },
        },
        required: ['location_id', 'items', 'customer_name', 'customer_phone', 'street_address', 'city', 'state', 'zip'],
        additionalProperties: false,
      },
      execute: async (input: any) => {
        const {
          location_id,
          items,
          customer_name,
          customer_email,
          customer_phone,
          street_address,
          city,
          state,
          zip,
          dropoff_instructions,
          tip,
        } = input as {
          location_id: string;
          items: Array<{ product_id: string; quantity: number }>;
          customer_name: string;
          customer_email?: string;
          customer_phone: string;
          street_address: string;
          city: string;
          state: string;
          zip: string;
          dropoff_instructions?: string;
          tip?: number;
        };

        const SERVICE_FEE = 1.0;
        const balance = await getBalance();

        if (balance < SERVICE_FEE) {
          return {
            success: false,
            error: '402 Payment Required',
            message: `Insufficient funds. GoPuff order requires ${SERVICE_FEE} USDK service fee, but you only have ${balance} USDK.`,
            required: SERVICE_FEE,
            available: balance,
          };
        }

        try {
          const response = await fetch('/api/grocery/order', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              location_id,
              items,
              fulfillment_method: 'Delivery',
              dropoff_instructions,
              tip,
              customer: {
                name: customer_name,
                email: customer_email,
                phone_number: customer_phone,
                address: {
                  street_address,
                  city,
                  region: state,
                  postal_code: zip,
                  country: 'US',
                },
              },
            }),
          });

          const data = await response.json();

          if (!response.ok) {
            return {
              success: false,
              error: data.error || 'Failed to create order',
              details: data.details,
            };
          }

          // Charge service fee
          const chargeResult = await spendBalance(SERVICE_FEE, 'GoPuff grocery order');

          return {
            success: true,
            orderId: data.orderId,
            order: data.order,
            serviceFee: SERVICE_FEE,
            newBalance: chargeResult.newBalance,
            message: `GoPuff order created! Order ID: ${data.orderId}. Use getGroceryPaymentLink to get the payment link. Charged ${SERVICE_FEE} USDK service fee.`,
            nextStep: 'Call getGroceryPaymentLink with this orderId to get the Stripe checkout link',
          };
        } catch (error) {
          return {
            success: false,
            error: 'Failed to place order',
            details: String(error),
          };
        }
      },
    }),

    tool({
      name: 'getGroceryPaymentLink',
      description: 'Get the Stripe payment link for a GoPuff order. Customer pays directly to GoPuff.',
      parameters: {
        type: 'object',
        properties: {
          orderId: {
            type: 'string',
            description: 'The order ID from placeGroceryOrder',
          },
        },
        required: ['orderId'],
        additionalProperties: false,
      },
      execute: async (input: any) => {
        const { orderId } = input as { orderId: string };

        try {
          const response = await fetch(`/api/grocery/order/payment?orderId=${orderId}`);
          const data = await response.json();

          if (!response.ok) {
            return {
              success: false,
              error: data.error || 'Failed to get payment link',
              details: data.details,
            };
          }

          return {
            success: true,
            orderId,
            paymentLink: data.paymentLink,
            message: `Payment link ready! Customer should complete payment at: ${data.paymentLink}\n\nOnce paid, GoPuff will deliver in approximately 30 minutes!`,
          };
        } catch (error) {
          return {
            success: false,
            error: 'Failed to get payment link',
            details: String(error),
          };
        }
      },
    }),

    tool({
      name: 'getGroceryOrderStatus',
      description: 'Check the status of a GoPuff order.',
      parameters: {
        type: 'object',
        properties: {
          orderId: {
            type: 'string',
            description: 'The order ID to check',
          },
        },
        required: ['orderId'],
        additionalProperties: false,
      },
      execute: async (input: any) => {
        const { orderId } = input as { orderId: string };

        try {
          const response = await fetch(`/api/grocery/order?orderId=${orderId}`);
          const data = await response.json();

          if (!response.ok) {
            return {
              success: false,
              error: data.error || 'Failed to get order status',
              details: data.details,
            };
          }

          return {
            success: true,
            orderId,
            order: data.order,
            message: `Order status retrieved`,
          };
        } catch (error) {
          return {
            success: false,
            error: 'Failed to get order status',
            details: String(error),
          };
        }
      },
    }),
  ],

  handoffs: [],
});
