import { NextRequest, NextResponse } from "next/server";
import { spendBalance, getBalance } from "@/lib/balanceStore";

const AGENT_WALLET = process.env.AGENT_WALLET_ADDRESS!;

export async function POST(request: NextRequest) {
  try {
    const { amount, description } = await request.json();

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: "Invalid amount" },
        { status: 400 }
      );
    }

    const currentBalance = getBalance(AGENT_WALLET);

    if (currentBalance < amount) {
      return NextResponse.json({
        success: false,
        error: "402 Payment Required",
        message: `Insufficient funds. Need ${amount} USDC, have ${currentBalance} USDC.`,
        required: amount,
        available: currentBalance,
      }, { status: 402 });
    }

    const newBalance = spendBalance(AGENT_WALLET, amount);

    console.log(`💰 SPENT: ${amount} USDC | ${description || 'No description'} | New balance: ${newBalance} USDC`);

    return NextResponse.json({
      success: true,
      spent: amount,
      newBalance,
      description,
      message: `Spent ${amount} USDC. New balance: ${newBalance} USDC`,
    });
  } catch (error) {
    console.error("Spend error:", error);
    return NextResponse.json(
      { error: "Spend failed", details: String(error) },
      { status: 500 }
    );
  }
}
