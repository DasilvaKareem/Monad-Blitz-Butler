"use client";

import React, { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { TranscriptItem } from "@/app/types";
import { useTranscript } from "@/app/contexts/TranscriptContext";
import { DownloadIcon, ClipboardCopyIcon } from "@radix-ui/react-icons";
import { GuardrailChip } from "./GuardrailChip";
import { RestaurantGrid, MenuItemsDisplay, SearchResultsDisplay } from "./RestaurantCard";
import { OrderConfirmationDisplay } from "./OrderCard";
import { ProductGrid, CartDisplay, GroceryOrderConfirmation } from "./GroceryCard";

export interface TranscriptProps {
  userText: string;
  setUserText: (val: string) => void;
  onSendMessage: () => void;
  canSend: boolean;
  downloadRecording: () => void;
}

function Transcript({
  userText,
  setUserText,
  onSendMessage,
  canSend,
  downloadRecording,
}: TranscriptProps) {
  const { transcriptItems, toggleTranscriptItemExpand } = useTranscript();
  const transcriptRef = useRef<HTMLDivElement | null>(null);
  const [prevLogs, setPrevLogs] = useState<TranscriptItem[]>([]);
  const [justCopied, setJustCopied] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  function scrollToBottom() {
    if (transcriptRef.current) {
      transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
    }
  }

  useEffect(() => {
    const hasNewMessage = transcriptItems.length > prevLogs.length;
    const hasUpdatedMessage = transcriptItems.some((newItem, index) => {
      const oldItem = prevLogs[index];
      return (
        oldItem &&
        (newItem.title !== oldItem.title || newItem.data !== oldItem.data)
      );
    });

    if (hasNewMessage || hasUpdatedMessage) {
      scrollToBottom();
    }

    setPrevLogs(transcriptItems);
  }, [transcriptItems]);

  // Autofocus on text box input on load
  useEffect(() => {
    if (canSend && inputRef.current) {
      inputRef.current.focus();
    }
  }, [canSend]);

  const handleCopyTranscript = async () => {
    if (!transcriptRef.current) return;
    try {
      await navigator.clipboard.writeText(transcriptRef.current.innerText);
      setJustCopied(true);
      setTimeout(() => setJustCopied(false), 1500);
    } catch (error) {
      console.error("Failed to copy transcript:", error);
    }
  };

  return (
    <div className="flex flex-col flex-1 bg-charcoal border border-border min-h-0 rounded-xl">
      <div className="flex flex-col flex-1 min-h-0">
        <div className="flex items-center justify-between px-6 py-3 sticky top-0 z-10 text-base border-b border-border bg-charcoal rounded-t-xl">
          <span className="font-display font-medium text-ivory tracking-wide">Transcript</span>
          <div className="flex gap-x-2">
            <button
              onClick={handleCopyTranscript}
              className="w-24 text-sm px-3 py-1.5 rounded-lg bg-surface-elevated border border-border hover:border-gold/30 hover:text-gold flex items-center justify-center gap-x-1.5 text-text-secondary transition-all duration-200"
            >
              <ClipboardCopyIcon />
              {justCopied ? "Copied!" : "Copy"}
            </button>
            <button
              onClick={downloadRecording}
              className="w-40 text-sm px-3 py-1.5 rounded-lg bg-surface-elevated border border-border hover:border-gold/30 hover:text-gold flex items-center justify-center gap-x-1.5 text-text-secondary transition-all duration-200"
            >
              <DownloadIcon />
              <span>Download Audio</span>
            </button>
          </div>
        </div>

        {/* Transcript Content */}
        <div
          ref={transcriptRef}
          className="overflow-auto p-4 flex flex-col gap-y-4 h-full"
        >
          {[...transcriptItems]
            .sort((a, b) => a.createdAtMs - b.createdAtMs)
            .map((item) => {
              const {
                itemId,
                type,
                role,
                data,
                expanded,
                timestamp,
                title = "",
                isHidden,
                guardrailResult,
              } = item;

            if (isHidden) {
              return null;
            }

            if (type === "MESSAGE") {
              const isUser = role === "user";
              const containerClasses = `flex justify-end flex-col ${
                isUser ? "items-end" : "items-start"
              }`;
              const bubbleBase = `max-w-lg p-3 ${
                isUser ? "bg-gold text-noir" : "bg-surface-elevated text-ivory border border-border"
              }`;
              const isBracketedMessage =
                title.startsWith("[") && title.endsWith("]");
              const messageStyle = isBracketedMessage
                ? 'italic text-text-muted'
                : '';
              const displayTitle = isBracketedMessage
                ? title.slice(1, -1)
                : title;

              return (
                <div key={itemId} className={containerClasses}>
                  <div className="max-w-lg">
                    <div
                      className={`${bubbleBase} rounded-t-xl ${
                        guardrailResult ? "" : "rounded-b-xl"
                      }`}
                    >
                      <div
                        className={`text-xs ${
                          isUser ? "text-noir/60" : "text-text-muted"
                        } font-mono`}
                      >
                        {timestamp}
                      </div>
                      <div className={`whitespace-pre-wrap ${messageStyle}`}>
                        <ReactMarkdown>{displayTitle}</ReactMarkdown>
                      </div>
                    </div>
                    {guardrailResult && (
                      <div className="bg-surface px-3 py-2 rounded-b-xl border border-t-0 border-border">
                        <GuardrailChip guardrailResult={guardrailResult} />
                      </div>
                    )}
                  </div>
                </div>
              );
            } else if (type === "BREADCRUMB") {
              // Check if this breadcrumb contains restaurant, menu, or order data
              const hasRestaurants = data?.restaurants && Array.isArray(data.restaurants);
              const hasMenuItems = data?.menuItems && Array.isArray(data.menuItems);
              const hasSearchResults = data?.results && Array.isArray(data.results);
              const isOrderResult = data?.orderId || (data?.restaurant && data?.items && data?.totalCost !== undefined);

              // Check for grocery/GoPuff data
              const hasGroceryProducts = data?.products && Array.isArray(data.products);
              const hasGroceryCart = data?.cartId || (data?.cart_id && data?.items);
              const isGroceryOrder = data?.orderId && (data?.paymentLink || data?.nextStep?.includes('getGroceryPaymentLink'));

              return (
                <div
                  key={itemId}
                  className="flex flex-col justify-start items-start text-text-muted text-sm w-full"
                >
                  <span className="text-xs font-mono text-text-muted">{timestamp}</span>
                  <div
                    className={`whitespace-pre-wrap flex items-center font-mono text-sm text-gold ${
                      data ? "cursor-pointer" : ""
                    }`}
                    onClick={() => data && toggleTranscriptItemExpand(itemId)}
                  >
                    {data && (
                      <span
                        className={`text-gold/60 mr-1 transform transition-transform duration-200 select-none font-mono ${
                          expanded ? "rotate-90" : "rotate-0"
                        }`}
                      >
                        ▶
                      </span>
                    )}
                    {title}
                  </div>

                  {/* Rich display for restaurants */}
                  {hasRestaurants && (
                    <div className="w-full mt-2">
                      <RestaurantGrid
                        restaurants={data.restaurants}
                        onViewMenu={(website) => console.log("View menu:", website)}
                        onCall={(phone, name) => console.log("Call:", phone, name)}
                      />
                    </div>
                  )}

                  {/* Rich display for menu items */}
                  {hasMenuItems && (
                    <div className="w-full">
                      <MenuItemsDisplay menuItems={data.menuItems} />
                    </div>
                  )}

                  {/* Rich display for search results */}
                  {hasSearchResults && !hasRestaurants && (
                    <div className="w-full">
                      <SearchResultsDisplay results={data.results} type="search" />
                    </div>
                  )}

                  {/* Rich display for order confirmation */}
                  {isOrderResult && !isGroceryOrder && (
                    <div className="w-full mt-2">
                      <OrderConfirmationDisplay orderData={data} />
                    </div>
                  )}

                  {/* Rich display for grocery products */}
                  {hasGroceryProducts && (
                    <div className="w-full mt-2">
                      <ProductGrid products={data.products} />
                    </div>
                  )}

                  {/* Rich display for grocery cart */}
                  {hasGroceryCart && data.items && (
                    <div className="w-full mt-2">
                      <CartDisplay
                        cartId={data.cartId || data.cart_id}
                        items={data.items.map((item: any) => ({
                          product_id: item.product_id,
                          product_name: item.product_name || item.name,
                          price: item.price,
                          quantity: item.quantity || 1,
                          image: item.image,
                        }))}
                      />
                    </div>
                  )}

                  {/* Rich display for grocery order confirmation */}
                  {isGroceryOrder && (
                    <div className="w-full mt-2">
                      <GroceryOrderConfirmation orderData={data} />
                    </div>
                  )}

                  {/* Raw JSON for other data */}
                  {expanded && data && !hasRestaurants && !hasMenuItems && !hasSearchResults && !isOrderResult && !hasGroceryProducts && !hasGroceryCart && !isGroceryOrder && (
                    <div className="text-text-secondary text-left">
                      <pre className="border-l-2 ml-1 border-gold/30 whitespace-pre-wrap break-words font-mono text-xs mb-2 mt-2 pl-2">
                        {JSON.stringify(data, null, 2)}
                      </pre>
                    </div>
                  )}

                  {/* Show raw JSON toggle for rich displays */}
                  {expanded && data && (hasRestaurants || hasMenuItems || hasSearchResults || isOrderResult || hasGroceryProducts || hasGroceryCart || isGroceryOrder) && (
                    <details className="mt-2 w-full">
                      <summary className="text-xs text-text-muted cursor-pointer hover:text-gold">
                        View raw data
                      </summary>
                      <pre className="border-l-2 ml-1 border-gold/30 whitespace-pre-wrap break-words font-mono text-xs mb-2 mt-2 pl-2 text-text-secondary">
                        {JSON.stringify(data, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              );
            } else {
              // Fallback if type is neither MESSAGE nor BREADCRUMB
              return (
                <div
                  key={itemId}
                  className="flex justify-center text-text-muted text-sm italic font-mono"
                >
                  Unknown item type: {type}{" "}
                  <span className="ml-2 text-xs">{timestamp}</span>
                </div>
              );
            }
          })}
        </div>
      </div>

      <div className="p-4 flex items-center gap-x-2 flex-shrink-0 border-t border-border">
        <input
          ref={inputRef}
          type="text"
          value={userText}
          onChange={(e) => setUserText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && canSend) {
              onSendMessage();
            }
          }}
          className="flex-1 px-4 py-2 bg-transparent text-ivory placeholder:text-text-muted focus:outline-none"
          placeholder="Type a message..."
        />
        <button
          onClick={onSendMessage}
          disabled={!canSend || !userText.trim()}
          className="bg-gold hover:bg-gold-light text-noir rounded-full px-2 py-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M2.01 21L23 12L2.01 3L2 10L17 12L2 14L2.01 21Z" fill="currentColor"/>
          </svg>
        </button>
      </div>
    </div>
  );
}

export default Transcript;
