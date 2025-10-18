import React, { useState } from "react";
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
  const [openMacros, setOpenMacros] = useState<boolean[]>(
    ingredients.map(() => false),
  );

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

    if (field.startsWith("product.")) {
      const productField = field.split(".")[1];
      updated[index] = {
        ...updated[index],
        product: { ...updated[index].product, [productField]: value },
      };
    } else if (field.startsWith("macro.")) {
      const macroField = field.split(".")[1] as keyof MacroPayload;
      const currentMacro =
        updated[index].product?.macro || ({} as Partial<MacroPayload>);
      updated[index] = {
        ...updated[index],
        product: {
          ...updated[index].product,
          macro: { ...currentMacro, [macroField]: Number(value) || 0 },
        },
      };
    } else if (field === "name") {
      updated[index] = {
        ...updated[index],
      };
    } else {
      updated[index] = { ...updated[index], [field]: value };
    }

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
            {/* Ligne produit + preptime + suppression */}
            <div className="flex flex-wrap justify-between gap-3 items-start">
              <div className="flex-1 min-w-[220px]">
                <FormInput
                  label="Produit"
                  value={ingredient.product?.name || ""}
                  onChange={(v) => updateIngredient(index, "product.name", v)}
                  placeholder="Nom du produit"
                />
              </div>

              <button
                onClick={() => removeIngredient(index)}
                className="mt-6 p-2 text-red-400 hover:text-red-300 transition-colors hover:cursor-pointer"
              >
                <Trash2 size={18} />
              </button>
            </div>

            {/* Quantité / Facteur / Unité */}
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

            {/* Autres propriétés */}
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

            {/* Toggle macros */}
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
