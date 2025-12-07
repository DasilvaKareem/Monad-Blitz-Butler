"use client";

import React, { useState } from "react";

// ============ PRODUCT CARD ============
interface Product {
  id?: string;
  product_id?: string;
  name?: string;
  product_name?: string;
  price?: number | string;
  image?: string;
  image_url?: string;
  description?: string;
  category?: string;
  location_id?: string;
  in_stock?: boolean;
  quantity?: number;
}

interface ProductCardProps {
  product: Product;
  onAddToCart?: (product: Product) => void;
}

export function ProductCard({ product, onAddToCart }: ProductCardProps) {
  const [imageError, setImageError] = useState(false);
  const [quantity, setQuantity] = useState(1);

  const name = product.name || product.product_name || "Product";
  const price = product.price;
  const image = product.image || product.image_url;
  const hasImage = image && !imageError;

  const formatPrice = (p: number | string | undefined) => {
    if (!p) return "";
    const num = typeof p === "string" ? parseFloat(p) : p;
    return `$${num.toFixed(2)}`;
  };

  return (
    <div className="bg-surface-elevated border border-border rounded-xl overflow-hidden hover:border-gold/30 transition-all duration-200">
      {/* Image */}
      <div className="relative h-28 w-full bg-gradient-to-br from-purple-500/20 to-gold/20">
        {hasImage ? (
          <img
            src={image}
            alt={name}
            className="absolute inset-0 w-full h-full object-contain p-2"
            onError={() => setImageError(true)}
            loading="lazy"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-3xl">🛒</span>
          </div>
        )}
        {product.in_stock === false && (
          <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-xs font-medium bg-red-500/90 text-white">
            Out of Stock
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-3">
        <h3 className="font-medium text-ivory text-sm line-clamp-2 h-10">{name}</h3>

        {product.category && (
          <span className="text-xs text-text-muted">{product.category}</span>
        )}

        <div className="flex items-center justify-between mt-2">
          <span className="text-lg font-semibold text-gold">{formatPrice(price)}</span>

          {onAddToCart && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-6 h-6 rounded bg-surface border border-border text-text-secondary hover:border-gold/30 text-sm"
              >
                -
              </button>
              <span className="w-6 text-center text-sm text-ivory">{quantity}</span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="w-6 h-6 rounded bg-surface border border-border text-text-secondary hover:border-gold/30 text-sm"
              >
                +
              </button>
            </div>
          )}
        </div>

        {onAddToCart && (
          <button
            onClick={() => onAddToCart({ ...product, quantity })}
            disabled={product.in_stock === false}
            className="w-full mt-2 text-xs px-3 py-1.5 rounded-lg bg-gold/10 text-gold hover:bg-gold/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Add to Cart
          </button>
        )}
      </div>
    </div>
  );
}

// ============ PRODUCT GRID ============
interface ProductGridProps {
  products: Product[];
  onAddToCart?: (product: Product) => void;
}

export function ProductGrid({ products, onAddToCart }: ProductGridProps) {
  if (!products || products.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mt-3">
      {products.slice(0, 12).map((product, index) => (
        <ProductCard
          key={product.id || product.product_id || index}
          product={product}
          onAddToCart={onAddToCart}
        />
      ))}
    </div>
  );
}

// ============ CART ITEM ============
interface CartItem {
  product_id: string;
  product_name: string;
  price?: number;
  quantity: number;
  image?: string;
}

interface CartItemRowProps {
  item: CartItem;
  onUpdateQuantity?: (productId: string, quantity: number) => void;
  onRemove?: (productId: string) => void;
}

export function CartItemRow({ item, onUpdateQuantity, onRemove }: CartItemRowProps) {
  const [imageError, setImageError] = useState(false);

  return (
    <div className="flex items-center gap-3 py-3 border-b border-border last:border-b-0">
      {/* Image */}
      <div className="w-16 h-16 rounded-lg bg-surface flex-shrink-0 overflow-hidden">
        {item.image && !imageError ? (
          <img
            src={item.image}
            alt={item.product_name}
            className="w-full h-full object-contain"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-2xl">
            🛒
          </div>
        )}
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-medium text-ivory truncate">{item.product_name}</h4>
        {item.price && (
          <p className="text-sm text-gold">${item.price.toFixed(2)} each</p>
        )}
      </div>

      {/* Quantity Controls */}
      <div className="flex items-center gap-2">
        {onUpdateQuantity && (
          <>
            <button
              onClick={() => onUpdateQuantity(item.product_id, Math.max(0, item.quantity - 1))}
              className="w-7 h-7 rounded-lg bg-surface border border-border text-text-secondary hover:border-gold/30 hover:text-gold transition-colors"
            >
              -
            </button>
            <span className="w-8 text-center text-ivory font-medium">{item.quantity}</span>
            <button
              onClick={() => onUpdateQuantity(item.product_id, item.quantity + 1)}
              className="w-7 h-7 rounded-lg bg-surface border border-border text-text-secondary hover:border-gold/30 hover:text-gold transition-colors"
            >
              +
            </button>
          </>
        )}
        {!onUpdateQuantity && (
          <span className="text-ivory font-medium">×{item.quantity}</span>
        )}
      </div>

      {/* Subtotal */}
      {item.price && (
        <div className="text-right w-20">
          <span className="text-gold font-semibold">
            ${(item.price * item.quantity).toFixed(2)}
          </span>
        </div>
      )}

      {/* Remove */}
      {onRemove && (
        <button
          onClick={() => onRemove(item.product_id)}
          className="text-red-400 hover:text-red-300 transition-colors p-1"
        >
          ✕
        </button>
      )}
    </div>
  );
}

// ============ FULL CART DISPLAY ============
interface CartDisplayProps {
  cartId?: string;
  items: CartItem[];
  locationName?: string;
  onUpdateQuantity?: (productId: string, quantity: number) => void;
  onRemove?: (productId: string) => void;
  onCheckout?: () => void;
  serviceFee?: number;
  deliveryFee?: number;
}

export function CartDisplay({
  cartId,
  items,
  locationName,
  onUpdateQuantity,
  onRemove,
  onCheckout,
  serviceFee = 1.0,
  deliveryFee = 0,
}: CartDisplayProps) {
  if (!items || items.length === 0) {
    return (
      <div className="bg-surface-elevated border border-border rounded-xl p-6 text-center">
        <span className="text-4xl mb-3 block">🛒</span>
        <p className="text-text-muted">Your cart is empty</p>
        <p className="text-xs text-text-muted mt-1">Search for products to add items</p>
      </div>
    );
  }

  const subtotal = items.reduce((sum, item) => sum + (item.price || 0) * item.quantity, 0);
  const total = subtotal + serviceFee + deliveryFee;

  return (
    <div className="bg-surface-elevated border border-border rounded-xl overflow-hidden mt-3">
      {/* Header */}
      <div className="px-4 py-3 bg-gradient-to-r from-purple-500/10 to-gold/10 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">🛒</span>
            <h3 className="font-display font-semibold text-ivory">GoPuff Cart</h3>
          </div>
          <span className="text-xs text-text-muted bg-surface px-2 py-1 rounded-full">
            {items.length} item{items.length !== 1 ? 's' : ''}
          </span>
        </div>
        {locationName && (
          <p className="text-xs text-text-muted mt-1">📍 {locationName}</p>
        )}
        {cartId && (
          <p className="text-xs text-text-muted font-mono">Cart: {cartId.slice(0, 12)}...</p>
        )}
      </div>

      {/* Items */}
      <div className="px-4 py-2 max-h-64 overflow-y-auto">
        {items.map((item, index) => (
          <CartItemRow
            key={item.product_id || index}
            item={item}
            onUpdateQuantity={onUpdateQuantity}
            onRemove={onRemove}
          />
        ))}
      </div>

      {/* Totals */}
      <div className="px-4 py-3 bg-surface border-t border-border space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-text-secondary">Subtotal</span>
          <span className="text-ivory">${subtotal.toFixed(2)}</span>
        </div>
        {deliveryFee > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-text-secondary">Delivery</span>
            <span className="text-ivory">${deliveryFee.toFixed(2)}</span>
          </div>
        )}
        <div className="flex justify-between text-sm">
          <span className="text-text-secondary">Service Fee (x402)</span>
          <span className="text-gold">${serviceFee.toFixed(2)} USDK</span>
        </div>
        <div className="flex justify-between text-base font-semibold pt-2 border-t border-border">
          <span className="text-ivory">Total</span>
          <span className="text-gold">${total.toFixed(2)}</span>
        </div>
      </div>

      {/* Checkout Button */}
      {onCheckout && (
        <div className="px-4 py-3 border-t border-border">
          <button
            onClick={onCheckout}
            className="w-full py-3 rounded-xl bg-gold text-noir font-semibold hover:bg-gold-light transition-colors flex items-center justify-center gap-2"
          >
            <span>Checkout</span>
            <span className="text-sm opacity-75">→ 30min delivery</span>
          </button>
        </div>
      )}

      {/* GoPuff branding */}
      <div className="px-4 py-2 bg-noir/50 text-center">
        <span className="text-xs text-text-muted">Powered by </span>
        <span className="text-xs font-semibold text-purple-400">GoPuff</span>
        <span className="text-xs text-text-muted"> • 30-minute delivery</span>
      </div>
    </div>
  );
}

// ============ GROCERY ORDER CONFIRMATION ============
interface GroceryOrderData {
  orderId?: string;
  order_id?: string;
  items?: CartItem[];
  customer?: {
    name?: string;
    address?: {
      street_address?: string;
      city?: string;
      region?: string;
      postal_code?: string;
    };
  };
  subtotal?: number;
  serviceFee?: number;
  total?: number;
  paymentLink?: string;
  status?: string;
  estimatedDelivery?: string;
}

interface GroceryOrderConfirmationProps {
  orderData: GroceryOrderData;
}

export function GroceryOrderConfirmation({ orderData }: GroceryOrderConfirmationProps) {
  const orderId = orderData.orderId || orderData.order_id;

  return (
    <div className="bg-surface-elevated border border-border rounded-xl overflow-hidden mt-3">
      {/* Header */}
      <div className="px-4 py-3 bg-gradient-to-r from-green-500/20 to-gold/10 border-b border-border">
        <div className="flex items-center gap-2">
          <span className="text-xl">✅</span>
          <h3 className="font-display font-semibold text-ivory">GoPuff Order Created</h3>
        </div>
        {orderId && (
          <p className="text-xs text-text-muted font-mono mt-1">Order ID: {orderId}</p>
        )}
      </div>

      {/* Order Details */}
      <div className="p-4 space-y-3">
        {/* Items */}
        {orderData.items && orderData.items.length > 0 && (
          <div>
            <p className="text-xs text-text-muted mb-2">Items</p>
            <div className="space-y-1">
              {orderData.items.map((item, index) => (
                <div key={index} className="flex justify-between text-sm">
                  <span className="text-ivory">{item.quantity}× {item.product_name}</span>
                  {item.price && (
                    <span className="text-gold">${(item.price * item.quantity).toFixed(2)}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Delivery Address */}
        {orderData.customer?.address && (
          <div>
            <p className="text-xs text-text-muted mb-1">Delivery To</p>
            <p className="text-sm text-ivory">
              {orderData.customer.name && <span>{orderData.customer.name}<br /></span>}
              {orderData.customer.address.street_address}<br />
              {orderData.customer.address.city}, {orderData.customer.address.region} {orderData.customer.address.postal_code}
            </p>
          </div>
        )}

        {/* Status */}
        <div className="flex items-center gap-2 py-2 px-3 bg-surface rounded-lg">
          <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse"></div>
          <span className="text-sm text-ivory">{orderData.status || 'Awaiting Payment'}</span>
        </div>

        {/* Estimated Delivery */}
        <div className="flex items-center gap-2 text-sm">
          <span className="text-text-muted">⏱️ Estimated delivery:</span>
          <span className="text-gold font-medium">{orderData.estimatedDelivery || '~30 minutes after payment'}</span>
        </div>

        {/* Payment Link */}
        {orderData.paymentLink && (
          <a
            href={orderData.paymentLink}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full py-3 rounded-xl bg-gold text-noir font-semibold hover:bg-gold-light transition-colors text-center"
          >
            Complete Payment →
          </a>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-2 bg-noir/50 text-center border-t border-border">
        <span className="text-xs text-text-muted">Fulfilled by </span>
        <span className="text-xs font-semibold text-purple-400">GoPuff</span>
      </div>
    </div>
  );
}
