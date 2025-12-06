"use client";

import { useState, useEffect } from "react";
import { useActiveAccount } from "thirdweb/react";
import { WalletConnect } from "@/components/WalletConnect";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function Home() {
  const account = useActiveAccount();
  const [agentBalance, setAgentBalance] = useState<number>(0);
  const [depositAmount, setDepositAmount] = useState<string>("3");
  const [isDepositing, setIsDepositing] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [agentWallet, setAgentWallet] = useState<string>("");

  // Fetch balance on load and after actions
  const fetchBalance = async () => {
    try {
      const res = await fetch("/api/balance");
      const data = await res.json();
      setAgentBalance(data.balance);
      setAgentWallet(data.agentWallet);
    } catch (error) {
      console.error("Failed to fetch balance:", error);
    }
  };

  useEffect(() => {
    fetchBalance();
  }, []);

  // Handle deposit
  const handleDeposit = async () => {
    if (!account?.address) return;

    setIsDepositing(true);
    try {
      const res = await fetch("/api/deposit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: parseFloat(depositAmount),
          userWallet: account.address,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setAgentBalance(data.newBalance);
      }
    } catch (error) {
      console.error("Deposit failed:", error);
    }
    setIsDepositing(false);
  };

  // Handle chat
  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);

    try {
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage,
          conversationHistory: messages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });
      const data = await res.json();

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.response || data.error },
      ]);
      setAgentBalance(data.balance);
    } catch (error) {
      console.error("Agent error:", error);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Error communicating with agent" },
      ]);
    }
    setIsLoading(false);
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 text-white">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Monad Blitz Butler
          </h1>
          <p className="text-gray-400">
            AI Agent with Real Purchasing Power
          </p>
        </div>

        {/* Wallet Connection */}
        <div className="flex justify-center mb-8">
          <WalletConnect />
        </div>

        {account?.address && (
          <>
            {/* User Wallet Info */}
            <div className="bg-gray-800/50 rounded-xl p-4 mb-6 border border-gray-700">
              <p className="text-sm text-gray-400">Your Wallet</p>
              <p className="font-mono text-sm">{account.address}</p>
            </div>

            {/* Agent Wallet & Balance */}
            <div className="bg-gradient-to-r from-purple-800/50 to-pink-800/50 rounded-xl p-6 mb-6 border border-purple-500/30">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <p className="text-sm text-gray-300">Agent Wallet</p>
                  <p className="font-mono text-xs text-gray-400">{agentWallet}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-300">Agent Balance</p>
                  <p className="text-3xl font-bold text-green-400">
                    ${agentBalance.toFixed(2)}
                  </p>
                </div>
              </div>

              {/* Deposit Section */}
              <div className="flex gap-3">
                <input
                  type="number"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  className="flex-1 bg-gray-900/50 border border-gray-600 rounded-lg px-4 py-2 text-white"
                  placeholder="Amount"
                  min="0.1"
                  step="0.1"
                />
                <button
                  onClick={handleDeposit}
                  disabled={isDepositing}
                  className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 px-6 py-2 rounded-lg font-semibold transition-colors"
                >
                  {isDepositing ? "Loading..." : "Load Agent"}
                </button>
              </div>
            </div>

            {/* Chat Interface */}
            <div className="bg-gray-800/50 rounded-xl border border-gray-700 overflow-hidden">
              {/* Messages */}
              <div className="h-96 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 && (
                  <div className="text-center text-gray-500 mt-20">
                    <p className="text-lg mb-2">Talk to your agent</p>
                    <p className="text-sm">
                      Try: &quot;Check my balance&quot; or &quot;Search for Monad blockchain&quot;
                    </p>
                  </div>
                )}
                {messages.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex ${
                      msg.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[80%] rounded-xl px-4 py-2 ${
                        msg.role === "user"
                          ? "bg-purple-600 text-white"
                          : "bg-gray-700 text-gray-100"
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-gray-700 rounded-xl px-4 py-2">
                      <p className="text-gray-400">Thinking...</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Input */}
              <div className="border-t border-gray-700 p-4">
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSend()}
                    className="flex-1 bg-gray-900 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-500"
                    placeholder="Ask your agent to do something..."
                  />
                  <button
                    onClick={handleSend}
                    disabled={isLoading || !input.trim()}
                    className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 px-6 py-3 rounded-lg font-semibold transition-colors"
                  >
                    Send
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="mt-4 flex gap-2 flex-wrap">
              <button
                onClick={() => setInput("Check my balance")}
                className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg text-sm transition-colors"
              >
                Check Balance
              </button>
              <button
                onClick={() => setInput("Search for Monad blockchain news")}
                className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg text-sm transition-colors"
              >
                Paid Search ($1)
              </button>
              <button
                onClick={() => setInput("Call the weather API")}
                className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg text-sm transition-colors"
              >
                API Call ($0.50)
              </button>
            </div>
          </>
        )}

        {!account?.address && (
          <div className="text-center text-gray-400 mt-12">
            <p className="text-lg">Connect your wallet to start</p>
          </div>
        )}
      </div>
    </main>
  );
}
