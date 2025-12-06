"use client";

import { Suspense } from "react";
import App from "./App";

export default function Home() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center h-screen bg-noir gap-4">
        <div className="w-12 h-12 star-motif animate-pulse" />
        <div className="font-display text-xl text-gold">Loading Monad Blitz Butler...</div>
      </div>
    }>
      <App />
    </Suspense>
  );
}
