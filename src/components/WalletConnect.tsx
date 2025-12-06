"use client";

import { ConnectButton } from "thirdweb/react";
import { client, monadTestnet } from "@/lib/thirdweb";

export function WalletConnect() {
  return (
    <ConnectButton
      client={client}
      chain={monadTestnet}
      connectButton={{
        label: "Connect Wallet",
        style: {
          backgroundColor: "transparent",
          color: "#C4A962",
          borderRadius: "8px",
          padding: "10px 20px",
          fontSize: "14px",
          fontWeight: "500",
          border: "1px solid #C4A962",
          transition: "all 0.2s ease",
        },
      }}
      detailsButton={{
        style: {
          backgroundColor: "#1A1A1A",
          color: "#FAF7F0",
          borderRadius: "8px",
          padding: "10px 20px",
          fontSize: "14px",
          fontWeight: "500",
          border: "1px solid #3A3A3A",
        },
      }}
    />
  );
}
