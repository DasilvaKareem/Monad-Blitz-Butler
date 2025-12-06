import { NextResponse } from "next/server";
import { getBalance } from "@/lib/balanceStore";

const AGENT_WALLET = process.env.AGENT_WALLET_ADDRESS!;

export async function GET() {
  try {
    const balance = getBalance(AGENT_WALLET);

    return NextResponse.json({
      agentWallet: AGENT_WALLET,
      balance,
    });
  } catch (error) {
    console.error("Balance error:", error);
    return NextResponse.json(
      { error: "Failed to get balance" },
      { status: 500 }
    );
  }
}
