import React, { useState } from "react";
import {
  Utensils,
  ChevronDown,
  ChevronRight,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
} from "lucide-react";
import { FormInput } from "@/components/atoms/FormInput";
import { MacroFormSection } from "@/components/molecules/MacroFormSection";
import type { MacroPayload } from "@/types/payloadBuilder";

interface FullIngredientEditFields {
  quantity: number;
  unit: string;
  product: string;
  title: string;
  cut: string;
  multiply_factor: number;
  macro: MacroPayload | null;
}

interface IngredientBlockEditableProps {
  block: any;
  expanded: boolean;
  toggleBlock: () => void;
  ingredients: any[];
  isAuthenticated: boolean;
  checkedItems: Record<string, boolean>;
  toggleChecked: (id: string) => void;
  onConfirmUpdate: (
    ingredientId: string,
    fields: FullIngredientEditFields,
  ) => Promise<boolean | void>;
  onAddIngredient?: (contentId: string) => Promise<boolean | void>;
  onDeleteIngredient?: (ingredientId: string) => Promise<boolean | void>;
}

const safeDecodeText = (text: string | null | undefined): string => {
  if (!text) return "";
  return String(text).replace(/├e/g, "é").replace(/├/g, "").trim();
};

const IngredientEditor: React.FC<{
  ingredient: any;
  onConfirm: (fields: FullIngredientEditFields) => void;
  onCancel: () => void;
}> = ({ ingredient, onConfirm, onCancel }) => {
  const [quantity, setQuantity] = useState(
    ingredient.quantity?.toString() || "0",
  );
  const [unit, setUnit] = useState(
    safeDecodeText(ingredient.ingredient_units?.[0]?.unit?.name) || "",
  );
  const [product, setProduct] = useState(
    safeDecodeText(ingredient.product?.name) || "",
  );
  const [title, setTitle] = useState(safeDecodeText(ingredient.title) || "");
  const [cut, setCut] = useState(safeDecodeText(ingredient.cut) || "");
  const [multiplyFactor, setMultiplyFactor] = useState(
    ingredient.multiply_factor?.toString() || "1",
  );
  const [macro, setMacro] = useState<MacroPayload | null>(
    ingredient.product?.macro || null,
  );
  const [isMacroOpen, setMacroOpen] = useState(false);

  const handleConfirm = () => {
    onConfirm({
      quantity: Number(quantity) || 0,
      unit,
      product,
      title,
      cut,
      multiply_factor: Number(multiplyFactor) || 1,
      macro,
    });
  };

  return (
    <div className="flex-1 flex-col gap-3 p-3 bg-[#2f2f2f] border border-neutral-600 rounded-md">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-3">
        <FormInput
          label="Titre (optionnel)"
          value={title}
          onChange={setTitle}
          placeholder="Ex: Pour la garniture"
        />
        <FormInput
          label="Produit"
          value={product}
          onChange={setProduct}
          placeholder="Nom du produit"
          required
        />
        <FormInput
          label="Quantité"
          type="number"
          value={quantity}
          onChange={setQuantity}
          placeholder="0"
        />
        <FormInput
          label="Unité"
          value={unit}
          onChange={setUnit}
          placeholder="g, ml, tasse..."
        />
        <FormInput
          label="Coupe (optionnel)"
          value={cut}
          onChange={setCut}
          placeholder="haché, en dés..."
        />
        <FormInput
          label="Multiplicateur"
          type="number"
          value={multiplyFactor}
          onChange={setMultiplyFactor}
          placeholder="1.0"
        />
      </div>

      <div className="border-t border-gray-600 pt-3 mt-4">
        <button
          type="button"
          onClick={() => setMacroOpen((prev) => !prev)}
          className="flex items-center gap-2 text-sm font-medium text-gray-300 hover:text-amber-400 transition-colors"
        >
          {isMacroOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          {isMacroOpen ? "Masquer les macros" : "Modifier les macros"}
        </button>
        {isMacroOpen && (
          <div className="mt-4">
            <MacroFormSection macro={macro} onChange={setMacro} />
          </div>
        )}
      </div>

      <div className="flex justify-end gap-2 mt-3">
        <button
          onClick={onCancel}
          className="p-2 rounded-md text-red-500 bg-neutral-700/60 hover:text-red-400"
        >
          <X size={18} />
        </button>
        <button
          onClick={handleConfirm}
          className="p-2 rounded-md text-green-500 bg-neutral-700/60 hover:text-green-400"
        >
          <Check size={18} />
        </button>
      </div>
    </div>
  );
};

export const IngredientBlockEditable: React.FC<
  IngredientBlockEditableProps
> = ({
  block,
  expanded,
  toggleBlock,
  ingredients,
  isAuthenticated,
  checkedItems,
  toggleChecked,
  onConfirmUpdate,
  onAddIngredient,
  onDeleteIngredient,
}) => {
  const [editingIngredientId, setEditingIngredientId] = useState<string | null>(
    null,
  );
  const contentId = block.content_id;

  const handleConfirmUpdate = async (
    ingredientId: string,
    fields: FullIngredientEditFields,
  ) => {
    const success = await onConfirmUpdate(ingredientId, fields);
    if (success !== false) {
      setEditingIngredientId(null);
    }
  };

  const getDisplayValue = (ing: any) => {
    const title = safeDecodeText(ing.title);
    const unitName =
      safeDecodeText(ing.ingredient_units?.[0]?.unit?.name) || "";
    const rawQuantity = String(ing.quantity || "").trim();
    const productName = safeDecodeText(ing.product?.name);
    const cut = safeDecodeText(ing.cut);

    const mainParts = [rawQuantity, unitName, productName]
      .filter((part) => part && part.length > 0)
      .join(" ");
    const fullDisplay = [
      title ? `[${title}]` : "",
      mainParts,
      cut ? `(${cut})` : "",
    ]
      .filter((part) => part.length > 0)
      .join(" ");

    return fullDisplay.length === 0 ? "[Ingrédient vide]" : fullDisplay;
  };

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
          {ingredients.map((ing: any) => {
            const id = ing.ingredient_id;
            const isEditingThis = editingIngredientId === id;

            return (
              <div key={id} className="flex items-start gap-3">
                {isEditingThis ? (
                  <IngredientEditor
                    ingredient={ing}
                    onConfirm={(fields) => handleConfirmUpdate(id, fields)}
                    onCancel={() => setEditingIngredientId(null)}
                  />
                ) : (
                  <>
                    <div className="pt-1.5">
                      <input
                        type="checkbox"
                        checked={!!checkedItems[id]}
                        onChange={() => toggleChecked(id)}
                        className="accent-amber-500 w-4 h-4 cursor-pointer"
                      />
                    </div>
                    <div
                      className={`group relative flex-1 border-b border-gray-800 pb-2`}
                    >
                      <span
                        className={
                          checkedItems[id] ? "line-through text-gray-500" : ""
                        }
                      >
                        {getDisplayValue(ing)}
                      </span>
                      {isAuthenticated && (
                        <div className="absolute top-0 right-0 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => onDeleteIngredient?.(id)}
                            className="p-1.5 rounded-md bg-neutral-700/80 text-red-500 hover:text-red-400"
                          >
                            <Trash2 size={16} />
                          </button>
                          <button
                            onClick={() => setEditingIngredientId(id)}
                            className="p-1.5 rounded-md bg-neutral-700/80 text-amber-500 hover:text-amber-400"
                          >
                            <Edit2 size={16} />
                          </button>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}

          {isAuthenticated && onAddIngredient && (
            <button
              onClick={() => onAddIngredient(contentId)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-amber-600 text-white text-sm hover:bg-amber-700 transition-colors mt-4"
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
