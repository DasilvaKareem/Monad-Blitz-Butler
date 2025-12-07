"use client";

import React, { useState } from "react";

interface OrderItem {
  name: string;
  price: number;
  quantity: number;
  addOns?: { name: string; price: number }[];
}

interface OrderDetails {
  restaurant: string;
  items: OrderItem[];
  subtotal: number;
  deliveryFee?: number;
  serviceFee?: number;
  tax?: number;
  tip?: number;
  total: number;
  deliveryAddress?: string;
  estimatedDelivery?: string;
  orderId?: string;
  status?: "pending" | "confirmed" | "preparing" | "on_the_way" | "delivered";
}

interface OrderCardProps {
  order: OrderDetails;
  onConfirm?: () => void;
  onCancel?: () => void;
  isConfirming?: boolean;
}

export function OrderCard({ order, onConfirm, onCancel, isConfirming }: OrderCardProps) {
  const {
    restaurant,
    items,
    subtotal,
    deliveryFee,
    serviceFee,
    tax,
    tip,
    total,
    deliveryAddress,
    estimatedDelivery,
    orderId,
    status,
  } = order;

  const statusColors = {
    pending: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    confirmed: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    preparing: "bg-purple-500/20 text-purple-400 border-purple-500/30",
    on_the_way: "bg-orange-500/20 text-orange-400 border-orange-500/30",
    delivered: "bg-green-500/20 text-green-400 border-green-500/30",
  };

  const statusLabels = {
    pending: "Pending Confirmation",
    confirmed: "Order Confirmed",
    preparing: "Being Prepared",
    on_the_way: "On the Way",
    delivered: "Delivered",
  };

  return (
    <div className="bg-surface-elevated border border-border rounded-xl overflow-hidden w-full max-w-md">
      {/* Header */}
      <div className="bg-gradient-to-r from-gold/20 to-gold/5 px-4 py-3 border-b border-border">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-display font-semibold text-ivory">{restaurant}</h3>
            {orderId && (
              <p className="text-xs text-text-muted font-mono">Order #{orderId}</p>
            )}
          </div>
          {status && (
            <span className={`px-2 py-1 rounded-full text-xs font-medium border ${statusColors[status]}`}>
              {statusLabels[status]}
            </span>
          )}
        </div>
      </div>

      {/* Order Items */}
      <div className="p-4 space-y-3">
        <div className="space-y-2">
          {items.map((item, index) => (
            <div key={index} className="bg-surface rounded-lg p-3">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs bg-gold/20 text-gold px-1.5 py-0.5 rounded font-medium">
                      {item.quantity}x
                    </span>
                    <span className="text-sm text-ivory font-medium">{item.name}</span>
                  </div>
                  {item.addOns && item.addOns.length > 0 && (
                    <div className="mt-1 ml-6 space-y-0.5">
                      {item.addOns.map((addOn, addOnIndex) => (
                        <div key={addOnIndex} className="flex justify-between text-xs text-text-muted">
                          <span>+ {addOn.name}</span>
                          <span>+${addOn.price.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <span className="text-sm text-ivory font-medium">
                  ${(item.price * item.quantity).toFixed(2)}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Divider */}
        <div className="border-t border-border my-3"></div>

        {/* Price Breakdown */}
        <div className="space-y-2 text-sm">
          <div className="flex justify-between text-text-secondary">
            <span>Subtotal</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>

          {deliveryFee !== undefined && deliveryFee > 0 && (
            <div className="flex justify-between text-text-secondary">
              <span>Delivery Fee</span>
              <span>${deliveryFee.toFixed(2)}</span>
            </div>
          )}

          {serviceFee !== undefined && serviceFee > 0 && (
            <div className="flex justify-between text-text-secondary">
              <span>Service Fee</span>
              <span>${serviceFee.toFixed(2)}</span>
            </div>
          )}

          {tax !== undefined && tax > 0 && (
            <div className="flex justify-between text-text-secondary">
              <span>Tax</span>
              <span>${tax.toFixed(2)}</span>
            </div>
          )}

          {tip !== undefined && tip > 0 && (
            <div className="flex justify-between text-text-secondary">
              <span>Tip</span>
              <span>${tip.toFixed(2)}</span>
            </div>
          )}

          {/* Total */}
          <div className="flex justify-between text-ivory font-semibold text-base pt-2 border-t border-border">
            <span>Total</span>
            <span className="text-gold">${total.toFixed(2)} USDC</span>
          </div>
        </div>

        {/* Delivery Info */}
        {deliveryAddress && (
          <div className="mt-3 p-3 bg-surface rounded-lg">
            <div className="flex items-start gap-2">
              <span className="text-lg">📍</span>
              <div>
                <p className="text-xs text-text-muted">Delivery Address</p>
                <p className="text-sm text-ivory">{deliveryAddress}</p>
              </div>
            </div>
            {estimatedDelivery && (
              <div className="flex items-center gap-2 mt-2">
                <span className="text-lg">🕐</span>
                <div>
                  <p className="text-xs text-text-muted">Estimated Delivery</p>
                  <p className="text-sm text-ivory">{estimatedDelivery}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        {(onConfirm || onCancel) && status === "pending" && (
          <div className="flex gap-2 mt-4">
            {onCancel && (
              <button
                onClick={onCancel}
                className="flex-1 px-4 py-2 rounded-lg bg-surface border border-border text-text-secondary hover:border-red-500/30 hover:text-red-400 transition-colors"
              >
                Cancel
              </button>
            )}
            {onConfirm && (
              <button
                onClick={onConfirm}
                disabled={isConfirming}
                className="flex-1 px-4 py-2 rounded-lg bg-gold text-noir font-semibold hover:bg-gold-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isConfirming ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-noir/30 border-t-noir rounded-full animate-spin"></span>
                    Processing...
                  </span>
                ) : (
                  `Confirm Order • $${total.toFixed(2)}`
                )}
              </button>
            )}
          </div>
        )}

        {/* Success Message */}
        {status === "confirmed" && (
          <div className="mt-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
            <div className="flex items-center gap-2 text-green-400">
              <span className="text-lg">✓</span>
              <span className="text-sm font-medium">Order placed successfully!</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

interface OrderConfirmationDisplayProps {
  orderData: any;
}

export function OrderConfirmationDisplay({ orderData }: OrderConfirmationDisplayProps) {
  // Parse the order data from the tool result
  const items: OrderItem[] = Array.isArray(orderData.items)
    ? orderData.items.map((item: any) => {
        if (typeof item === 'string') {
          return { name: item, price: 0, quantity: 1 };
        }
        return {
          name: item.name || item,
          price: item.price || 0,
          quantity: item.quantity || 1,
          addOns: item.addOns,
        };
      })
    : orderData.items?.split(',').map((item: string) => ({
        name: item.trim(),
        price: 0,
        quantity: 1,
      })) || [];

  const order: OrderDetails = {
    restaurant: orderData.restaurant || "Restaurant",
    items,
    subtotal: orderData.totalCost || orderData.subtotal || 0,
    deliveryFee: orderData.deliveryFee,
    serviceFee: orderData.serviceFee,
    tax: orderData.tax,
    tip: orderData.tip,
    total: orderData.totalCost || orderData.total || 0,
    deliveryAddress: orderData.deliveryAddress,
    estimatedDelivery: orderData.estimatedDelivery,
    orderId: orderData.orderId?.replace('ORD-', ''),
    status: orderData.success ? "confirmed" : "pending",
  };

  return <OrderCard order={order} />;
}
