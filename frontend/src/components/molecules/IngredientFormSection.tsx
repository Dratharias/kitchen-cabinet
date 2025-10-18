import React, { useState, useEffect } from "react";
import { useFormCache } from "@/stores/formCacheStore";
import { FormInput } from "@/components/atoms/FormInput";
import { FormCheckbox } from "@/components/atoms/FormCheckbox";
import { Trash2, Plus, ChevronDown, ChevronRight } from "lucide-react";
import { MacroFormSection } from "./MacroFormSection";
import { IngredientPayload, MacroPayload } from "@/types";

interface IngredientFormSectionProps {
  ingredients: Partial<IngredientPayload>[];
  onChange: (ingredients: Partial<IngredientPayload>[]) => void;
}

export const IngredientFormSection: React.FC<IngredientFormSectionProps> = ({
  ingredients,
  onChange,
}) => {
  const { cache, fetchResource } = useFormCache();
  const [openMacros, setOpenMacros] = useState<boolean[]>(
    ingredients.map(() => false),
  );

  useEffect(() => {
    fetchResource("publications", "publications");
  }, [fetchResource]);

  const toggleMacro = (index: number) => {
    setOpenMacros((prev) => {
      const updated = [...prev];
      updated[index] = !updated[index];
      return updated;
    });
  };

  const addIngredient = () => {
    onChange([
      ...ingredients,
      {
        quantity: 0,
        multiply_factor: 1,
        product: {
          name: "",
          is_recipe: false,
          is_recipe_id: null,
          macro: {
            calories: 0,
            protein: 0,
            carbs: 0,
            fiber: 0,
            saturated: 0,
            trans: 0,
            caffein: 0,
            alcohol: 0,
          },
        },
        ingredient_units: [{ name: "" }],
      },
    ]);
    setOpenMacros((prev) => [...prev, false]);
  };

  const removeIngredient = (index: number) => {
    onChange(ingredients.filter((_, i) => i !== index));
    setOpenMacros((prev) => prev.filter((_, i) => i !== index));
  };

  const updateIngredient = (index: number, field: string, value: any) => {
    const updated = [...ingredients];
    const currentIngredient = { ...updated[index] };

    if (field.startsWith("product.")) {
      const productField = field.split(".")[1];
      const newProduct = {
        ...currentIngredient.product,
        [productField]: value,
      };

      if (productField === "is_recipe" && !value) {
        newProduct.is_recipe_id = null;
      }

      currentIngredient.product = newProduct;
    } else if (field.startsWith("macro.")) {
      const macroField = field.split(".")[1] as keyof MacroPayload;
      const currentMacro =
        currentIngredient.product?.macro || ({} as Partial<MacroPayload>);
      currentIngredient.product = {
        ...currentIngredient.product,
        macro: { ...currentMacro, [macroField]: Number(value) || 0 },
      };
    } else {
      (currentIngredient as any)[field] = value;
    }

    updated[index] = currentIngredient;
    onChange(updated);
  };

  const handleRecipeLink = (index: number, publicationId: string) => {
    const selectedPub = cache.publications.find(
      (p) => p.value === publicationId,
    );
    const updated = [...ingredients];
    const currentProduct = updated[index].product || {};

    updated[index] = {
      ...updated[index],
      product: {
        ...currentProduct,
        is_recipe_id: publicationId,
        name: selectedPub ? selectedPub.label : currentProduct.name,
      },
    };
    onChange(updated);
  };

  const updateMacro = (index: number, macro: Partial<MacroPayload> | null) => {
    const updated = [...ingredients];
    updated[index] = {
      ...updated[index],
      product: {
        ...updated[index].product,
        macro,
      },
    };
    onChange(updated);
  };

  return (
    <div className="p-4 border border-gray-600 rounded-lg bg-[#292929]/50 space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-200">Ingrédients</h3>
        <button
          type="button"
          onClick={addIngredient}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-amber-600 text-white text-sm hover:bg-amber-700 transition-colors hover:cursor-pointer"
        >
          <Plus size={16} />
          Ajouter
        </button>
      </div>

      <div className="space-y-6">
        {ingredients.map((ingredient, index) => (
          <div
            key={index}
            className="p-4 border border-gray-600 rounded-lg bg-[#292929]/40 space-y-4"
          >
            <div className="flex flex-wrap justify-between gap-3 items-start">
              <div className="flex-1 min-w-[220px]">
                <FormInput
                  label="Produit"
                  value={ingredient.product?.name || ""}
                  onChange={(v) => updateIngredient(index, "product.name", v)}
                  placeholder="Nom du produit"
                  disabled={!!ingredient.product?.is_recipe_id}
                />
              </div>

              <button
                type="button"
                onClick={() => removeIngredient(index)}
                className="mt-6 p-2 text-red-400 hover:text-red-300 transition-colors hover:cursor-pointer"
              >
                <Trash2 size={18} />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <FormInput
                label="Quantité"
                type="number"
                value={String(ingredient.quantity || 0)}
                onChange={(v) => updateIngredient(index, "quantity", Number(v))}
                placeholder="0"
              />
              <FormInput
                label="Facteur"
                type="number"
                value={String(ingredient.multiply_factor || 1.0)}
                onChange={(v) =>
                  updateIngredient(index, "multiply_factor", Number(v))
                }
                placeholder="1.0"
              />
              <FormInput
                label="Unité"
                value={ingredient.ingredient_units?.[0]?.name || ""}
                onChange={(v) => updateIngredient(index, "ingredient_units", v)}
                placeholder="g, ml, tasse..."
              />
            </div>

            <FormInput
              label="Coupe"
              value={ingredient.cut || ""}
              onChange={(v) => updateIngredient(index, "cut", v)}
              placeholder="en dés, tranché, etc."
            />

            <FormCheckbox
              label="Est une recette"
              checked={ingredient.product?.is_recipe || false}
              onChange={(v) => updateIngredient(index, "product.is_recipe", v)}
            />

            {ingredient.product?.is_recipe && (
              <div className="mt-2">
                <label className="text-sm font-medium text-gray-400">
                  Lier à la recette
                </label>
                <select
                  value={ingredient.product?.is_recipe_id || ""}
                  onChange={(e) => handleRecipeLink(index, e.target.value)}
                  className="w-full mt-1.5 px-3 py-2 rounded-md border border-gray-600 bg-[#292929] text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="">Sélectionner une recette</option>
                  {cache.publications.map((pub) => (
                    <option key={pub.value} value={pub.value}>
                      {pub.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="border-t border-gray-600 pt-4 mt-4">
              <button
                type="button"
                onClick={() => toggleMacro(index)}
                className="flex items-center gap-2 text-sm font-medium text-gray-300 hover:text-amber-400 transition-colors hover:cursor-pointer"
              >
                {openMacros[index] ? (
                  <ChevronDown size={16} />
                ) : (
                  <ChevronRight size={16} />
                )}
                {openMacros[index]
                  ? "Masquer les macros"
                  : "Ajouter des macros"}
              </button>

              {openMacros[index] && (
                <div className="mt-4">
                  <MacroFormSection
                    macro={ingredient.product?.macro || null}
                    onChange={(macro) => updateMacro(index, macro)}
                  />
                </div>
              )}
            </div>
          </div>
        ))}

        {ingredients.length === 0 && (
          <p className="text-sm text-gray-500 text-center py-6">
            Aucun ingrédient. Cliquez sur "Ajouter" pour commencer.
          </p>
        )}
      </div>
    </div>
  );
};
