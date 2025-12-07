import { NextRequest, NextResponse } from "next/server";
import { addBalance, getBalance } from "@/lib/balanceStore";
import { createThirdwebClient } from "thirdweb";
import { privateKeyToAccount } from "thirdweb/wallets";
import { defineChain } from "thirdweb/chains";

const AGENT_WALLET = process.env.AGENT_WALLET_ADDRESS!;
const THIRDWEB_SECRET_KEY = process.env.THIRDWEB_SECRET_KEY!;

// Define Monad Testnet
const monadTestnet = defineChain({
  id: 10143,
  name: "Monad Testnet",
  nativeCurrency: {
    name: "Monad",
    symbol: "MON",
    decimals: 18,
  },
  rpc: "https://testnet-rpc.monad.xyz",
});

export async function POST(request: NextRequest) {
  try {
    const { amount } = await request.json();

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: "Invalid amount" },
        { status: 400 }
      );
    }

    // For now, we add to the in-memory balance
    // In production, this would:
    // 1. Verify user has enough tokens
    // 2. Transfer tokens to agent wallet on-chain
    // 3. Update balance based on actual on-chain balance

    const newBalance = addBalance(AGENT_WALLET, amount);

    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("💰 AGENT FUNDED");
    console.log(`   Amount: ${amount} USDK`);
    console.log(`   New Balance: ${newBalance} USDK`);
    console.log(`   Agent Wallet: ${AGENT_WALLET}`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    return NextResponse.json({
      success: true,
      funded: amount,
      newBalance,
      agentWallet: AGENT_WALLET,
      message: `Agent funded with ${amount} USDK. New balance: ${newBalance} USDK`,
    });
  } catch (error) {
    console.error("Fund agent error:", error);
    return NextResponse.json(
      { error: "Failed to fund agent", details: String(error) },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const balance = getBalance(AGENT_WALLET);

    return NextResponse.json({
      agentWallet: AGENT_WALLET,
      balance,
      currency: "USDK",
    });
  } catch (error) {
    console.error("Get balance error:", error);
    return NextResponse.json(
      { error: "Failed to get balance" },
      { status: 500 }
    );
  }
}
