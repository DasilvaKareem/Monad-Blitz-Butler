import type { Metadata } from "next";
import "../globals.css";
import "../lib/envSetup";

export const metadata: Metadata = {
  title: "Monad Blitz Butler - Voice Agent",
  description: "Voice-powered AI Agent with real purchasing power",
};

export default function VoiceLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
