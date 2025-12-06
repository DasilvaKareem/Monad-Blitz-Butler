"use client";

import { ThirdwebProvider } from "thirdweb/react";
import { TranscriptProvider } from "@/app/contexts/TranscriptContext";
import { EventProvider } from "@/app/contexts/EventContext";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThirdwebProvider>
      <TranscriptProvider>
        <EventProvider>{children}</EventProvider>
      </TranscriptProvider>
    </ThirdwebProvider>
  );
}
