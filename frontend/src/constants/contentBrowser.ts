import { FileText, BookOpen, Lightbulb, Utensils } from "lucide-react";

export const TYPE_MAP = {
  books: ["Guide"],
  reviews: ["Review"],
  article: ["Article"],
  recipes: ["Recette", "Ingredient"],
} as const;

export const ICON_MAP = {
  books: BookOpen,
  reviews: FileText,
  article: Lightbulb,
  recipes: Utensils,
} as const;

export const LABEL_MAP = {
  books: "Livres",
  reviews: "Critiques",
  article: "Articles",
  recipes: "Recettes",
} as const;

export const CATEGORIES = ["books", "reviews", "article", "recipes"] as const;
export type CategoryKey = (typeof CATEGORIES)[number];
