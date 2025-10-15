import React from "react";
import { Utensils, ChevronDown, ChevronRight, Trash2, Plus } from "lucide-react";
import { InlineEditField } from "@/components/view/InlineEditField";

interface IngredientBlockEditableProps {
  block: any;
  expanded: boolean;
  toggleBlock: () => void;
  servingFactor: number;
  onServingChange: (factor: number) => void;
  ingredients: any[];
  isAuthenticated: boolean;
  checkedItems: Record<string, boolean>;
  toggleChecked: (id: string) => void;

  // hooks (useIngredientEdit)
  editingField: string | null;
  editValues: Record<string, string>;
  startEdit: (fieldId: string, value: string) => void;
  cancelEdit: (fieldId: string) => void;
  updateValue: (fieldId: string, value: string) => void;
  confirmIngredient: (
    ingredientId: string,
    field: string,
    resourceField: string
  ) => void;
  addIngredient: () => Promise<void>;
  deleteIngredient: (ingredientId: string) => Promise<void>;
  isLoading: boolean;
}

export const IngredientBlockEditable: React.FC<IngredientBlockEditableProps> = ({
  block,
  expanded,
  toggleBlock,
  servingFactor,
  onServingChange,
  ingredients,
  isAuthenticated,
  checkedItems,
  toggleChecked,
  editingField,
  editValues,
  startEdit,
  cancelEdit,
  updateValue,
  confirmIngredient,
  addIngredient,
  deleteIngredient,
}) => {
  return (
    <div className="border border-gray-700 rounded-lg bg-[#1F1F1F]/80 mb-4 overflow-hidden">
      <header
        className="flex items-center justify-between px-4 py-2 bg-[#2a2a2a]/70 cursor-pointer"
        onClick={toggleBlock}
      >
        <h3 className="text-lg font-semibold flex items-center gap-2 text-white">
          <Utensils className="w-5 h-5 text-amber-500" />
          {block.subtitle || "Ingrédients"}
        </h3>
        {expanded ? (
          <ChevronDown className="w-5 h-5 text-gray-400" />
        ) : (
          <ChevronRight className="w-5 h-5 text-gray-400" />
        )}
      </header>

      {expanded && (
        <div className="p-4 space-y-3 text-gray-300">
          {ingredients.map((ing: any) => (
            <div
              key={ing.ingredient_id}
              className="flex items-center gap-3 border-b border-gray-700 pb-2"
            >
              <input
                type="checkbox"
                checked={!!checkedItems[ing.ingredient_id]}
                onChange={() => toggleChecked(ing.ingredient_id)}
                className="accent-amber-500"
              />

              {isAuthenticated ? (
                <div className="flex flex-wrap gap-2 flex-1">
                  <InlineEditField
                    fieldId={`quantity-${ing.ingredient_id}`}
                    value={String(ing.quantity || 0)}
                    isEditing={editingField === `quantity-${ing.ingredient_id}`}
                    editValue={
                      editValues[`quantity-${ing.ingredient_id}`] ||
                      String(ing.quantity || 0)
                    }
                    onStartEdit={() =>
                      startEdit(`quantity-${ing.ingredient_id}`, String(ing.quantity || 0))
                    }
                    onCancel={() => cancelEdit(`quantity-${ing.ingredient_id}`)}
                    onConfirm={() =>
                      confirmIngredient(ing.ingredient_id, "quantity", "quantity")
                    }
                    onChange={(v) =>
                      updateValue(`quantity-${ing.ingredient_id}`, v)
                    }
                  />
                  <InlineEditField
                    fieldId={`unit-${ing.ingredient_id}`}
                    value={ing.ingredient_units?.[0]?.unit?.name || ""}
                    isEditing={editingField === `unit-${ing.ingredient_id}`}
                    editValue={
                      editValues[`unit-${ing.ingredient_id}`] ||
                      ing.ingredient_units?.[0]?.unit?.name ||
                      ""
                    }
                    onStartEdit={() =>
                      startEdit(
                        `unit-${ing.ingredient_id}`,
                        ing.ingredient_units?.[0]?.unit?.name || ""
                      )
                    }
                    onCancel={() => cancelEdit(`unit-${ing.ingredient_id}`)}
                    onConfirm={() =>
                      confirmIngredient(ing.ingredient_id, "unit", "ingredient_units")
                    }
                    onChange={(v) => updateValue(`unit-${ing.ingredient_id}`, v)}
                  />
                  <InlineEditField
                    fieldId={`product-${ing.ingredient_id}`}
                    value={ing.product?.name || ""}
                    isEditing={editingField === `product-${ing.ingredient_id}`}
                    editValue={
                      editValues[`product-${ing.ingredient_id}`] ||
                      ing.product?.name ||
                      ""
                    }
                    onStartEdit={() =>
                      startEdit(`product-${ing.ingredient_id}`, ing.product?.name || "")
                    }
                    onCancel={() => cancelEdit(`product-${ing.ingredient_id}`)}
                    onConfirm={() =>
                      confirmIngredient(ing.ingredient_id, "product", "product")
                    }
                    onChange={(v) => updateValue(`product-${ing.ingredient_id}`, v)}
                  />
                  <button
                    onClick={() => deleteIngredient(ing.ingredient_id)}
                    className="text-red-400 hover:text-red-300 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ) : (
                <span
                  className={
                    checkedItems[ing.ingredient_id]
                      ? "line-through text-gray-500"
                      : ""
                  }
                >
                  {`${ing.quantity || ""} ${ing.ingredient_units?.[0]?.unit?.name || ""} ${ing.product?.name || ""}`}
                </span>
              )}
            </div>
          ))}

          {isAuthenticated && (
            <button
              onClick={addIngredient}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-amber-600 text-white text-sm hover:bg-amber-700 transition-colors hover:cursor-pointer"
            >
              <Plus size={16} />
              Ajouter un ingrédient
            </button>
          )}
        </div>
      )}
    </div>
  );
};
