"use client";

import React, { useState, useEffect } from "react";

interface UserPreferences {
  location: string;
  allergies: string[];
  dietaryOptions: string[];
  cuisines: string[];
  priceTier: string;
  wellnessGoal: string;
}

const DIETARY_OPTIONS = [
  "Vegan",
  "Vegetarian",
  "Gluten-Free",
  "Dairy-Free",
  "Halal",
  "Kosher",
  "Organic",
  "Keto",
  "Paleo",
];

const CUISINES = [
  "American",
  "Mexican",
  "Italian",
  "Japanese",
  "Chinese",
  "Korean",
  "Thai",
  "Vietnamese",
  "Indian",
  "Mediterranean",
  "Greek",
  "Middle Eastern",
  "French",
  "Spanish",
  "Caribbean",
  "Fusion",
];

const PRICE_TIERS = [
  { value: "any", label: "Any Price" },
  { value: "$", label: "$ (Budget)" },
  { value: "$$", label: "$$ (Moderate)" },
  { value: "$$$", label: "$$$ (Upscale)" },
  { value: "$$$$", label: "$$$$ (Fine Dining)" },
];

const COMMON_ALLERGIES = [
  "Peanuts",
  "Tree Nuts",
  "Milk",
  "Eggs",
  "Wheat",
  "Soy",
  "Fish",
  "Shellfish",
  "Sesame",
];

const WELLNESS_GOALS = [
  { value: "none", label: "No Goal", description: "Just looking for good food" },
  { value: "cut", label: "Cut Weight", description: "Lower calories, high protein, lean foods" },
  { value: "gain", label: "Gain Muscle", description: "High protein, calorie surplus, nutrient dense" },
  { value: "recomp", label: "Body Recomposition", description: "High protein, moderate calories, balanced macros" },
];

interface ConfigureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (preferences: UserPreferences) => void;
  initialPreferences?: UserPreferences;
}

export function ConfigureModal({ isOpen, onClose, onSave, initialPreferences }: ConfigureModalProps) {
  const [preferences, setPreferences] = useState<UserPreferences>(
    initialPreferences || {
      location: "",
      allergies: [],
      dietaryOptions: [],
      cuisines: [],
      priceTier: "any",
      wellnessGoal: "none",
    }
  );

  const [customAllergy, setCustomAllergy] = useState("");

  useEffect(() => {
    if (initialPreferences) {
      setPreferences(initialPreferences);
    }
  }, [initialPreferences]);

  if (!isOpen) return null;

  const toggleArrayItem = (array: string[], item: string): string[] => {
    if (array.includes(item)) {
      return array.filter((i) => i !== item);
    }
    return [...array, item];
  };

  const handleSave = () => {
    // Save to localStorage
    localStorage.setItem("userPreferences", JSON.stringify(preferences));
    onSave(preferences);
    onClose();
  };

  const addCustomAllergy = () => {
    if (customAllergy.trim() && !preferences.allergies.includes(customAllergy.trim())) {
      setPreferences({
        ...preferences,
        allergies: [...preferences.allergies, customAllergy.trim()],
      });
      setCustomAllergy("");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-noir/80 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-charcoal border border-border rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border bg-surface-elevated">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl text-ivory">Configure Preferences</h2>
            <button
              onClick={onClose}
              className="text-text-muted hover:text-ivory transition-colors text-2xl"
            >
              ×
            </button>
          </div>
          <p className="text-sm text-text-muted mt-1">
            Set your location, dietary preferences, and cuisine choices
          </p>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)] space-y-6">
          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-ivory mb-2">
              📍 Location
            </label>
            <input
              type="text"
              value={preferences.location}
              onChange={(e) => setPreferences({ ...preferences, location: e.target.value })}
              placeholder="Enter your city or address (e.g., San Francisco, CA)"
              className="w-full px-4 py-3 bg-surface border border-border rounded-xl text-ivory placeholder:text-text-muted focus:outline-none focus:border-gold/50 transition-colors"
            />
          </div>

          {/* Allergies */}
          <div>
            <label className="block text-sm font-medium text-ivory mb-2">
              ⚠️ Food Allergies
            </label>
            <div className="flex flex-wrap gap-2 mb-3">
              {COMMON_ALLERGIES.map((allergy) => (
                <button
                  key={allergy}
                  onClick={() =>
                    setPreferences({
                      ...preferences,
                      allergies: toggleArrayItem(preferences.allergies, allergy),
                    })
                  }
                  className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                    preferences.allergies.includes(allergy)
                      ? "bg-red-500/20 text-red-400 border border-red-500/50"
                      : "bg-surface border border-border text-text-secondary hover:border-red-500/30"
                  }`}
                >
                  {allergy}
                </button>
              ))}
            </div>
            {/* Custom allergies */}
            {preferences.allergies.filter((a) => !COMMON_ALLERGIES.includes(a)).length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {preferences.allergies
                  .filter((a) => !COMMON_ALLERGIES.includes(a))
                  .map((allergy) => (
                    <span
                      key={allergy}
                      className="px-3 py-1.5 rounded-full text-sm bg-red-500/20 text-red-400 border border-red-500/50 flex items-center gap-2"
                    >
                      {allergy}
                      <button
                        onClick={() =>
                          setPreferences({
                            ...preferences,
                            allergies: preferences.allergies.filter((a) => a !== allergy),
                          })
                        }
                        className="hover:text-red-300"
                      >
                        ×
                      </button>
                    </span>
                  ))}
              </div>
            )}
            <div className="flex gap-2">
              <input
                type="text"
                value={customAllergy}
                onChange={(e) => setCustomAllergy(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addCustomAllergy()}
                placeholder="Add custom allergy..."
                className="flex-1 px-3 py-2 bg-surface border border-border rounded-lg text-ivory text-sm placeholder:text-text-muted focus:outline-none focus:border-gold/50"
              />
              <button
                onClick={addCustomAllergy}
                className="px-4 py-2 bg-surface border border-border rounded-lg text-text-secondary hover:border-gold/30 hover:text-gold transition-colors text-sm"
              >
                Add
              </button>
            </div>
          </div>

          {/* Dietary Options */}
          <div>
            <label className="block text-sm font-medium text-ivory mb-2">
              🥗 Dietary Preferences
            </label>
            <div className="flex flex-wrap gap-2">
              {DIETARY_OPTIONS.map((option) => (
                <button
                  key={option}
                  onClick={() =>
                    setPreferences({
                      ...preferences,
                      dietaryOptions: toggleArrayItem(preferences.dietaryOptions, option),
                    })
                  }
                  className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                    preferences.dietaryOptions.includes(option)
                      ? "bg-green-500/20 text-green-400 border border-green-500/50"
                      : "bg-surface border border-border text-text-secondary hover:border-green-500/30"
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          {/* Cuisines */}
          <div>
            <label className="block text-sm font-medium text-ivory mb-2">
              🍽️ Preferred Cuisines
            </label>
            <div className="flex flex-wrap gap-2">
              {CUISINES.map((cuisine) => (
                <button
                  key={cuisine}
                  onClick={() =>
                    setPreferences({
                      ...preferences,
                      cuisines: toggleArrayItem(preferences.cuisines, cuisine),
                    })
                  }
                  className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                    preferences.cuisines.includes(cuisine)
                      ? "bg-gold/20 text-gold border border-gold/50"
                      : "bg-surface border border-border text-text-secondary hover:border-gold/30"
                  }`}
                >
                  {cuisine}
                </button>
              ))}
            </div>
          </div>

          {/* Price Tier */}
          <div>
            <label className="block text-sm font-medium text-ivory mb-2">
              💰 Price Range
            </label>
            <div className="flex flex-wrap gap-2">
              {PRICE_TIERS.map((tier) => (
                <button
                  key={tier.value}
                  onClick={() => setPreferences({ ...preferences, priceTier: tier.value })}
                  className={`px-4 py-2 rounded-lg text-sm transition-all ${
                    preferences.priceTier === tier.value
                      ? "bg-gold text-noir font-medium"
                      : "bg-surface border border-border text-text-secondary hover:border-gold/30"
                  }`}
                >
                  {tier.label}
                </button>
              ))}
            </div>
          </div>

          {/* Wellness Goals */}
          <div>
            <label className="block text-sm font-medium text-ivory mb-2">
              💪 Wellness Goal
            </label>
            <p className="text-xs text-text-muted mb-3">
              The AI will recommend foods that align with your fitness goals
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {WELLNESS_GOALS.map((goal) => (
                <button
                  key={goal.value}
                  onClick={() => setPreferences({ ...preferences, wellnessGoal: goal.value })}
                  className={`p-4 rounded-xl text-left transition-all ${
                    preferences.wellnessGoal === goal.value
                      ? "bg-purple-500/20 border-2 border-purple-500/50"
                      : "bg-surface border border-border hover:border-purple-500/30"
                  }`}
                >
                  <div className={`font-medium ${
                    preferences.wellnessGoal === goal.value ? "text-purple-400" : "text-ivory"
                  }`}>
                    {goal.label}
                  </div>
                  <div className="text-xs text-text-muted mt-1">
                    {goal.description}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border bg-surface-elevated flex justify-between items-center">
          <button
            onClick={() => {
              setPreferences({
                location: "",
                allergies: [],
                dietaryOptions: [],
                cuisines: [],
                priceTier: "any",
                wellnessGoal: "none",
              });
            }}
            className="px-4 py-2 text-sm text-text-muted hover:text-ivory transition-colors"
          >
            Reset All
          </button>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-surface border border-border text-text-secondary hover:border-gold/30 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-6 py-2 rounded-lg bg-gold text-noir font-semibold hover:bg-gold-light transition-colors"
            >
              Save Preferences
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Hook to get and use preferences
export function useUserPreferences() {
  const [preferences, setPreferences] = useState<UserPreferences>({
    location: "",
    allergies: [],
    dietaryOptions: [],
    cuisines: [],
    priceTier: "any",
    wellnessGoal: "none",
  });

  useEffect(() => {
    const saved = localStorage.getItem("userPreferences");
    if (saved) {
      try {
        setPreferences(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse preferences:", e);
      }
    }
  }, []);

  const savePreferences = (newPrefs: UserPreferences) => {
    setPreferences(newPrefs);
    localStorage.setItem("userPreferences", JSON.stringify(newPrefs));
  };

  const getPreferencesContext = () => {
    const parts = [];
    if (preferences.location) {
      parts.push(`Location: ${preferences.location}`);
    }
    if (preferences.allergies.length > 0) {
      parts.push(`Allergies: ${preferences.allergies.join(", ")}`);
    }
    if (preferences.dietaryOptions.length > 0) {
      parts.push(`Dietary: ${preferences.dietaryOptions.join(", ")}`);
    }
    if (preferences.cuisines.length > 0) {
      parts.push(`Preferred cuisines: ${preferences.cuisines.join(", ")}`);
    }
    if (preferences.priceTier !== "any") {
      parts.push(`Price range: ${preferences.priceTier}`);
    }
    if (preferences.wellnessGoal && preferences.wellnessGoal !== "none") {
      const goalDescriptions: Record<string, string> = {
        cut: "Wellness Goal: Cut Weight - Recommend lower calorie, high protein, lean options. Suggest grilled over fried, salads, lean proteins, and portion-conscious choices.",
        gain: "Wellness Goal: Gain Muscle - Recommend high protein, calorie-dense, nutrient-rich foods. Suggest larger portions, protein shakes, complex carbs, and muscle-building meals.",
        recomp: "Wellness Goal: Body Recomposition - Recommend high protein, moderate calorie options with balanced macros. Suggest lean proteins with healthy carbs and fats.",
      };
      parts.push(goalDescriptions[preferences.wellnessGoal] || `Wellness Goal: ${preferences.wellnessGoal}`);
    }
    return parts.join(". ");
  };

  return { preferences, savePreferences, getPreferencesContext };
}
