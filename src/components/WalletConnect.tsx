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
          backgroundColor: "#8B5CF6",
          color: "white",
          borderRadius: "12px",
          padding: "12px 24px",
          fontSize: "16px",
          fontWeight: "600",
        },
      }}
    />
  );
}
