import { FileText, Lightbulb, Utensils } from "lucide-react";

export const TYPE_MAP = {
  reviews: ["Review"],
  articles: ["Article"],
  recettes: ["Recette", "Ingredient"],
} as const;

export const ICON_MAP = {
  reviews: FileText,
  articles: Lightbulb,
  recettes: Utensils,
} as const;

export const LABEL_MAP = {
  reviews: "Critiques",
  articles: "Articles",
  recettes: "Recettes",
} as const;

export const CATEGORIES = ["reviews", "articles", "recettes"] as const;
export type CategoryKey = (typeof CATEGORIES)[number];
