import { NextRequest, NextResponse } from "next/server";
import { addBalance } from "@/lib/balanceStore";

const AGENT_WALLET = process.env.AGENT_WALLET_ADDRESS!;

export async function POST(request: NextRequest) {
  try {
    const { amount, userWallet } = await request.json();

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: "Invalid amount" },
        { status: 400 }
      );
    }

    if (!userWallet) {
      return NextResponse.json(
        { error: "User wallet required" },
        { status: 400 }
      );
    }

    // Add balance to agent wallet (in real app, this would verify on-chain deposit)
    const newBalance = addBalance(AGENT_WALLET, amount);

    return NextResponse.json({
      success: true,
      agentWallet: AGENT_WALLET,
      depositedAmount: amount,
      newBalance,
      message: `Deposited ${amount} USDC to agent wallet`,
    });
  } catch (error) {
    console.error("Deposit error:", error);
    return NextResponse.json(
      { error: "Deposit failed" },
      { status: 500 }
    );
  }
}
