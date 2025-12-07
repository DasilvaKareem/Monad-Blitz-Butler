"use client";

import React from "react";
import Image from "next/image";

interface Restaurant {
  name: string;
  address?: string;
  rating?: number | string;
  totalRatings?: number;
  priceLevel?: string;
  phone?: string;
  website?: string;
  googleMapsUrl?: string;
  description?: string;
  isOpen?: boolean;
  source?: string;
  image?: string;
}

interface RestaurantCardProps {
  restaurant: Restaurant;
  onViewMenu?: (website: string) => void;
  onCall?: (phone: string, name: string) => void;
}

export function RestaurantCard({ restaurant, onViewMenu, onCall }: RestaurantCardProps) {
  const {
    name,
    address,
    rating,
    totalRatings,
    priceLevel,
    phone,
    website,
    googleMapsUrl,
    description,
    isOpen,
    source,
    image,
  } = restaurant;

  // Generate a placeholder image URL based on restaurant name
  const imageUrl = image || `https://source.unsplash.com/400x300/?restaurant,food,${encodeURIComponent(name.split(' ')[0])}`;

  return (
    <div className="bg-surface-elevated border border-border rounded-xl overflow-hidden hover:border-gold/30 transition-all duration-200">
      {/* Image */}
      <div className="relative h-32 w-full bg-noir">
        <Image
          src={imageUrl}
          alt={name}
          fill
          className="object-cover"
          unoptimized
        />
        {isOpen !== null && isOpen !== undefined && (
          <div className={`absolute top-2 right-2 px-2 py-0.5 rounded-full text-xs font-medium ${
            isOpen ? "bg-green-500/90 text-white" : "bg-red-500/90 text-white"
          }`}>
            {isOpen ? "Open" : "Closed"}
          </div>
        )}
        {priceLevel && (
          <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-xs font-medium bg-noir/80 text-gold">
            {priceLevel}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-3">
        <h3 className="font-display font-semibold text-ivory text-sm truncate">{name}</h3>

        {/* Rating */}
        {rating && (
          <div className="flex items-center gap-1 mt-1">
            <span className="text-gold">★</span>
            <span className="text-sm text-ivory">{rating}</span>
            {totalRatings && (
              <span className="text-xs text-text-muted">({totalRatings})</span>
            )}
          </div>
        )}

        {/* Address */}
        {address && address !== "See website for address" && (
          <p className="text-xs text-text-muted mt-1 truncate">{address}</p>
        )}

        {/* Description */}
        {description && !address && (
          <p className="text-xs text-text-muted mt-1 line-clamp-2">{description}</p>
        )}

        {/* Source badge */}
        {source && (
          <div className="mt-2">
            <span className="text-xs px-2 py-0.5 rounded-full bg-surface text-text-muted">
              {source}
            </span>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 mt-3">
          {website && onViewMenu && (
            <button
              onClick={() => onViewMenu(website)}
              className="flex-1 text-xs px-2 py-1.5 rounded-lg bg-gold/10 text-gold hover:bg-gold/20 transition-colors"
            >
              View Menu
            </button>
          )}
          {phone && onCall && (
            <button
              onClick={() => onCall(phone, name)}
              className="flex-1 text-xs px-2 py-1.5 rounded-lg bg-surface border border-border hover:border-gold/30 text-text-secondary hover:text-gold transition-colors"
            >
              Call
            </button>
          )}
          {googleMapsUrl && (
            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 text-xs px-2 py-1.5 rounded-lg bg-surface border border-border hover:border-gold/30 text-text-secondary hover:text-gold transition-colors text-center"
            >
              Map
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

interface RestaurantGridProps {
  restaurants: Restaurant[];
  onViewMenu?: (website: string) => void;
  onCall?: (phone: string, name: string) => void;
}

export function RestaurantGrid({ restaurants, onViewMenu, onCall }: RestaurantGridProps) {
  if (!restaurants || restaurants.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-3">
      {restaurants.map((restaurant, index) => (
        <RestaurantCard
          key={`${restaurant.name}-${index}`}
          restaurant={restaurant}
          onViewMenu={onViewMenu}
          onCall={onCall}
        />
      ))}
    </div>
  );
}

interface MenuItemsDisplayProps {
  menuItems: { name: string; price: string }[];
  restaurantName?: string;
}

export function MenuItemsDisplay({ menuItems, restaurantName }: MenuItemsDisplayProps) {
  if (!menuItems || menuItems.length === 0) {
    return null;
  }

  return (
    <div className="mt-3 bg-surface-elevated border border-border rounded-xl p-4">
      {restaurantName && (
        <h3 className="font-display font-semibold text-ivory mb-3">{restaurantName} Menu</h3>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {menuItems.map((item, index) => (
          <div
            key={index}
            className="flex justify-between items-center py-2 px-3 bg-surface rounded-lg"
          >
            <span className="text-sm text-ivory truncate flex-1 mr-2">{item.name}</span>
            <span className="text-sm font-medium text-gold whitespace-nowrap">{item.price}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

interface SearchResultsDisplayProps {
  results: any[];
  type: "restaurants" | "menu" | "search";
  onViewMenu?: (website: string) => void;
  onCall?: (phone: string, name: string) => void;
}

export function SearchResultsDisplay({ results, type, onViewMenu, onCall }: SearchResultsDisplayProps) {
  if (!results || results.length === 0) {
    return null;
  }

  if (type === "restaurants") {
    return <RestaurantGrid restaurants={results} onViewMenu={onViewMenu} onCall={onCall} />;
  }

  if (type === "menu" && results[0]?.name && results[0]?.price) {
    return <MenuItemsDisplay menuItems={results} />;
  }

  // Generic search results
  return (
    <div className="mt-3 space-y-2">
      {results.map((result, index) => (
        <a
          key={index}
          href={result.url || result.website || "#"}
          target="_blank"
          rel="noopener noreferrer"
          className="block bg-surface-elevated border border-border rounded-lg p-3 hover:border-gold/30 transition-colors"
        >
          <h4 className="text-sm font-medium text-ivory truncate">{result.title || result.name}</h4>
          {(result.snippet || result.description) && (
            <p className="text-xs text-text-muted mt-1 line-clamp-2">
              {result.snippet || result.description}
            </p>
          )}
        </a>
      ))}
    </div>
  );
}
