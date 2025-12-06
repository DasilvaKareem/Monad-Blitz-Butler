import { RealtimeAgent, tool } from '@openai/agents/realtime';
import { getBalance, addBalance } from './butler';

export const walletAgent = new RealtimeAgent({
  name: 'wallet',
  voice: 'echo',
  handoffDescription:
    'Handles wallet operations including checking balance, making deposits, and viewing transaction history.',

  instructions: `You are the Wallet Agent for Blitz Butler.

You handle all wallet and financial operations:
- Check current balance
- Process deposits
- View available funds

Always confirm transactions with the user before processing.
After any operation, report the updated balance.

When done with wallet operations, ask if the user wants to do anything else and hand back to the main butler agent.`,

  tools: [
    tool({
      name: 'checkBalance',
      description: 'Check the current wallet balance',
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
        };
      },
    }),

    tool({
      name: 'deposit',
      description: 'Deposit funds into the agent wallet',
      parameters: {
        type: 'object',
        properties: {
          amount: {
            type: 'number',
            description: 'Amount to deposit in USDC',
          },
        },
        required: ['amount'],
        additionalProperties: false,
      },
      execute: async (input: any) => {
        const { amount } = input as { amount: number };
        if (amount <= 0) {
          return { success: false, error: 'Amount must be positive' };
        }
        const newBalance = addBalance(amount);
        return {
          success: true,
          deposited: amount,
          newBalance,
          message: `Successfully deposited ${amount} USDC. New balance: ${newBalance} USDC`,
        };
      },
    }),

    tool({
      name: 'getWalletInfo',
      description: 'Get wallet address and info',
      parameters: {
        type: 'object',
        properties: {},
        required: [],
        additionalProperties: false,
      },
      execute: async () => {
        return {
          address: '0xAgentWallet...monad',
          network: 'Monad Testnet',
          balance: getBalance(),
          currency: 'USDC',
        };
      },
    }),
  ],

  handoffs: [],
});
