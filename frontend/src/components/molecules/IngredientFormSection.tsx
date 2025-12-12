import React from "react";
import { FormInput } from "@/components/atoms/FormInput";
import { FormTextarea } from "@/components/atoms/FormTextarea";
import { Trash2, Plus } from "lucide-react";
import { IngredientPayload } from "@/types";

interface IngredientFormSectionProps {
  ingredients: Partial<IngredientPayload>[];
  onChange: (ingredients: Partial<IngredientPayload>[]) => void;
}

export const IngredientFormSection: React.FC<IngredientFormSectionProps> = ({
  ingredients,
  onChange,
}) => {
  const addIngredient = () => {
    onChange([
      ...ingredients,
      {
        quantity: 0,
        note: "",
        product: {
          name: "",
        },
        unit: {
          name: "",
        },
      },
    ]);
  };

  const removeIngredient = (index: number) => {
    onChange(ingredients.filter((_, i) => i !== index));
  };

  const updateIngredient = (index: number, field: string, value: any) => {
    const updated = [...ingredients];
    const currentIngredient = { ...updated[index] };

    if (field === "product.name") {
      currentIngredient.product = {
        ...currentIngredient.product,
        name: value,
      };
    } else if (field === "unit.name") {
      currentIngredient.unit = value ? { name: value } : null;
    } else {
      (currentIngredient as any)[field] = value;
    }

    updated[index] = currentIngredient;
    onChange(updated);
  };

  // Group ingredients by section
  const groupedIngredients = React.useMemo(() => {
    const groups: Record<string, { indices: number[]; ingredients: Partial<IngredientPayload>[] }> = {};

    ingredients.forEach((ingredient, index) => {
      const section = ingredient.section || "Sans groupe";
      if (!groups[section]) {
        groups[section] = { indices: [], ingredients: [] };
      }
      groups[section].indices.push(index);
      groups[section].ingredients.push(ingredient);
    });

    return groups;
  }, [ingredients]);

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
        {Object.entries(groupedIngredients).map(([sectionName, { indices }]) => (
          <div key={sectionName} className="space-y-3">
            {/* Section Header */}
            {sectionName !== "Sans groupe" && (
              <div className="flex items-center gap-2 pt-2">
                <div className="h-px bg-amber-600/30 flex-1" />
                <h4 className="text-sm font-semibold text-amber-500 uppercase tracking-wide">
                  {sectionName}
                </h4>
                <div className="h-px bg-amber-600/30 flex-1" />
              </div>
            )}

            {/* Ingredients in this section */}
            {indices.map((index) => {
              const ingredient = ingredients[index];
              return (
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

            <div className="grid grid-cols-2 gap-3">
              <FormInput
                label="Quantité"
                type="number"
                value={String(ingredient.quantity || 0)}
                onChange={(v) => updateIngredient(index, "quantity", Number(v))}
                placeholder="0"
              />
              <FormInput
                label="Unité"
                value={ingredient.unit?.name || ""}
                onChange={(v) => updateIngredient(index, "unit.name", v)}
                placeholder="g, ml, tasse..."
              />
            </div>

            <FormInput
              label="Section (optionnel)"
              value={ingredient.section || ""}
              onChange={(v) => updateIngredient(index, "section", v)}
              placeholder="Ex: Tofu, Vinaigrette, Salade..."
            />

            <FormTextarea
              label="Note"
              value={ingredient.note || ""}
              onChange={(v) => updateIngredient(index, "note", v)}
              placeholder="Notes sur l'ingrédient..."
              rows={2}
            />
          </div>
              );
            })}
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
