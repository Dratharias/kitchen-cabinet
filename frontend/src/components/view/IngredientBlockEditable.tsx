import React, { useState, useMemo } from "react"; // Assurez-vous d'importer useMemo
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
import { FormInput } from "../atoms/FormInput";
import { MacroFormSection } from "../molecules/MacroFormSection";
import { MacroPayload } from "../../types";
import { SubRecipeViewer } from "./SubRecipeViewer";

interface FullIngredientEditFields {
  quantity: number;
  unit: string;
  product: string;
  title: string;
  cut: string;
  multiply_factor: number;
  macro: MacroPayload | null;
  section: string;
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
  onDeleteIngredient?: (ingredientId: string) => Promise<boolean | void>;
  onDeleteBlock?: () => void;
  pendingAddItem: boolean;
  onConfirmAdd: (fields: FullIngredientEditFields) => void;
  onCancelAdd: () => void;
  onAddIngredientClick: () => void;
}


const safeDecodeText = (text: string | null | undefined): string => {
  if (!text) return "";
  try {
    return decodeURIComponent(String(text));
  } catch (e) {
    return String(text).replace(/├®/g, "é").replace(/├/g, "").trim();
  }
};

const IngredientEditor: React.FC<{
  ingredient: any;
  onConfirm: (fields: FullIngredientEditFields) => void;
  onCancel: () => void;
}> = ({ ingredient, onConfirm, onCancel }) => {
  const [fields, setFields] = useState<FullIngredientEditFields>({
    quantity: ingredient.quantity ?? 0,
    unit: safeDecodeText(ingredient.unit?.name) || "",
    product: safeDecodeText(ingredient.product?.name) || "",
    title: safeDecodeText(ingredient.title) || "",
    cut: safeDecodeText(ingredient.cut) || "",
    multiply_factor: ingredient.multiply_factor ?? 1,
    macro: ingredient.product?.macro || null,
    section: safeDecodeText(ingredient.section) || "",
  });
  const [isMacroOpen, setMacroOpen] = useState(
    !!(fields.macro && Object.values(fields.macro).some((v) => v)),
  );

  const handleChange = (field: keyof FullIngredientEditFields, value: any) => {
    setFields((prev) => ({ ...prev, [field]: value }));
  };

  const handleConfirm = () => onConfirm(fields);

  return (
    <div className="flex-1 w-full flex-col gap-3 p-3 bg-[#2f2f2f] border border-neutral-600 rounded-lg shadow-lg">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-3 gap-y-2">
        <FormInput
          label="Titre (optionnel)"
          value={fields.title}
          onChange={(v) => handleChange("title", v)}
          placeholder="Ex: Pour la garniture"
        />
        <FormInput
          label="Produit"
          value={fields.product}
          onChange={(v) => handleChange("product", v)}
          placeholder="Nom du produit"
          required
        />
        <FormInput
          label="Quantité"
          type="number"
          value={String(fields.quantity)}
          onChange={(v) => handleChange("quantity", Number(v))}
          placeholder="0"
        />
        <FormInput
          label="Unité"
          value={fields.unit}
          onChange={(v) => handleChange("unit", v)}
          placeholder="g, ml, tasse..."
        />
        <FormInput
          label="Coupe (optionnel)"
          value={fields.cut}
          onChange={(v) => handleChange("cut", v)}
          placeholder="haché, en dés..."
        />
        <FormInput
          label="Multiplicateur"
          type="number"
          value={String(fields.multiply_factor)}
          onChange={(v) => handleChange("multiply_factor", Number(v))}
          placeholder="1.0"
        />
      </div>
      <FormInput
        label="Groupe / Section (optionnel)"
        value={fields.section}
        onChange={(v) => handleChange("section", v)}
        placeholder="Ex: Vinaigrette, Salade, Épices..."
      />
      <div>
        <button
          type="button"
          onClick={() => setMacroOpen((prev) => !prev)}
          className="flex items-center gap-2 pt-2 text-sm font-medium text-gray-300 hover:text-amber-400 hover:cursor-pointer"
        >
          {isMacroOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          {isMacroOpen ? "Masquer les macros" : "Modifier les macros"}
        </button>
        {isMacroOpen && (
          <div className="mt-3">
            <MacroFormSection
              macro={fields.macro}
              onChange={(m) => handleChange("macro", m)}
            />
          </div>
        )}
      </div>
      <div className="flex justify-end gap-2 mt-3">
        <button
          onClick={handleConfirm}
          className="p-2 rounded-md text-green-500 bg-neutral-700/60 hover:text-green-400 hover:cursor-pointer"
        >
          <Check size={18} />
        </button>
        <button
          onClick={onCancel}
          className="p-2 rounded-md text-red-500 bg-neutral-700/60 hover:text-red-400 hover:cursor-pointer"
        >
          <X size={18} />
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
  onDeleteIngredient,
  onDeleteBlock,
  pendingAddItem,
  onConfirmAdd,
  onCancelAdd,
  onAddIngredientClick,
}) => {
  const [editingIngredientId, setEditingIngredientId] = useState<string | null>(
    null,
  );

  // Normalize ingredients: flatten nested structure from backend
  const normalizedIngredients = useMemo(() => {
    return ingredients.map((ing: any) => {
      // If ingredient is nested (from backend), flatten it
      if (ing.ingredient) {
        return {
          ingredient_id: ing.ingredient_id,
          product_id: ing.ingredient.product_id,
          quantity: ing.ingredient.quantity,
          unit_id: ing.ingredient.unit_id,
          cut: ing.ingredient.cut,
          title: ing.ingredient.title,
          note: ing.ingredient.note,
          multiply_factor: ing.ingredient.multiply_factor,
          section: ing.ingredient.section,
          product: ing.ingredient.product,
          unit: ing.ingredient.unit,
        };
      }
      // Already flat (from form state)
      return ing;
    });
  }, [ingredients]);

  const [yieldFactor, setYieldFactor] = useState("1.0");
  const parsedYield = parseFloat(yieldFactor) || 1;

  const handleConfirmUpdate = async (
    ingredientId: string,
    fields: FullIngredientEditFields,
  ) => {
    const success = await onConfirmUpdate(ingredientId, fields);
    if (success !== false) setEditingIngredientId(null);
  };

  const getDisplayValue = (ing: any) => {
    const factor = parsedYield * (ing.multiply_factor ?? 1);
    const adjustedQty = (ing.quantity ?? 0) * factor;

    const unitName = safeDecodeText(ing.unit?.name) || "";
    const productName = safeDecodeText(ing.product?.name);
    const cut = safeDecodeText(ing.cut);

    const mainParts = [
      adjustedQty ? adjustedQty.toFixed(1) : "",
      unitName,
      productName,
    ]
      .filter(Boolean)
      .join(" ");

    return [mainParts, cut ? `(${cut})` : ""].filter(Boolean).join(" ") || "[Ingrédient vide]";
  };


  // Logique de regroupement par section
  const groupedIngredients = useMemo(() => {
    const groups = new Map<string | null, any[]>();

    for (const ing of normalizedIngredients) {
      const section = ing.section || null;
      if (!groups.has(section)) {
        groups.set(section, []);
      }
      groups.get(section)!.push(ing);
    }

    // Convert map to array with null section first
    const result: { title: string | null; items: any[] }[] = [];
    if (groups.has(null)) {
      result.push({ title: null, items: groups.get(null)! });
      groups.delete(null);
    }

    // Add other sections in order they appear
    for (const [section, items] of groups.entries()) {
      result.push({ title: section, items });
    }

    return result;
  }, [ingredients]);

  return (
    <div className="border border-gray-700 rounded-lg bg-[#1F1F1F]/80 mb-4 overflow-hidden">
      <header
        className="flex items-center justify-between px-3 py-2 bg-[#2a2a2a]/70 cursor-pointer"
        onClick={toggleBlock}
      >
        <h3 className="text-lg font-semibold flex items-center gap-2 text-white">
          <Utensils className="w-5 h-5 text-amber-500" />
          {block.subtitle || "Ingrédients"}
        </h3>
        <div className="flex items-center gap-2">
          <label htmlFor="yieldFactor" className="text-gray-300 text-sm">
            Rendement :
          </label>
          <input
            id="yieldFactor"
            type="number"
            step="0.1"
            min="0.1"
            value={yieldFactor}
            onClick={(e) => e.stopPropagation()}
            onChange={(e) => setYieldFactor(e.target.value)}
            className="w-20 bg-neutral-700 text-white text-center rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
          <span className="text-amber-400 text-sm">×</span>
        </div>
        <div className="flex items-center gap-2">
          {isAuthenticated && onDeleteBlock && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDeleteBlock();
              }}
              className="p-1.5 rounded-md bg-neutral-700/80 text-red-500 hover:text-red-400 hover:cursor-pointer"
            >
              <Trash2 size={16} />
            </button>
          )}
          {expanded ? (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronRight className="w-5 h-5 text-gray-400" />
          )}
        </div>
      </header>
      {expanded && (
        <div className="p-3 text-gray-300">
          {normalizedIngredients.length === 0 && (
            <p className="text-gray-500 text-sm">Aucun ingrédient disponible</p>
          )}

          {/* Boucle sur les groupes */}
          {groupedIngredients.map((group, index) => (
            <div key={group.title || `untitled-${index}`}>
              {/* Afficher le titre du groupe */}
              {group.title && (
                <div className="flex items-center gap-2 mt-4 mb-3 first:mt-0">
                  <div className="h-px bg-amber-600/30 flex-1" />
                  <h4 className="text-sm font-semibold text-amber-500 uppercase tracking-wide px-2">
                    {group.title}
                  </h4>
                  <div className="h-px bg-amber-600/30 flex-1" />
                </div>
              )}

              {/* Boucle sur les ingrédients du groupe */}
              {group.items.map((ing: any, ingIdx: number) => {
                const id = ing.ingredient_id;
                const isEditingThis = editingIngredientId === id;
                const isFirst = ingIdx === 0;

                return (
                  <div key={id} className={`flex items-start w-full ${isFirst ? "-mt-1" : ""}`}>
                    {isEditingThis ? (
                      <IngredientEditor
                        ingredient={ing}
                        onConfirm={(fields) => handleConfirmUpdate(id, fields)}
                        onCancel={() => setEditingIngredientId(null)}
                      />
                    ) : ing.product?.is_recipe_id ? (
                      <SubRecipeViewer
                        subRecipeId={ing.product.is_recipe_id}
                        initialIngredient={ing}
                        isAuthenticated={isAuthenticated}
                      />
                    ) : (
                      <div
                        className={`flex items-center border-b border-gray-800 w-full pl-5 ${
                          isFirst ? "pt-0 pb-2" : "py-2"
                        }`}
                      >
                        <div className="flex justify-center items-center w-8">
                          <input
                            type="checkbox"
                            checked={!!checkedItems[id]}
                            onChange={() => toggleChecked(id)}
                            className="accent-amber-500 w-4 h-4 cursor-pointer"
                          />
                        </div>

                        <div className="flex flex-1 items-center justify-between group">
                          <div
                            className={checkedItems[id] ? "flex w-full line-through text-gray-500" : "flex w-full"}
                            onClick={() => toggleChecked(id)}
                          >
                            <p className="whitespace-pre-line hover:cursor-pointer w-full ml-2">
                              {getDisplayValue(ing)}
                            </p>
                          </div>

                          {isAuthenticated && (
                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity ms-2">
                              <button
                                onClick={() => onDeleteIngredient?.(id)}
                                className="p-1.5 rounded-md bg-neutral-700/80 text-red-500 hover:text-red-400 hover:cursor-pointer"
                              >
                                <Trash2 size={16} />
                              </button>
                              <button
                                onClick={() => setEditingIngredientId(id)}
                                className="p-1.5 rounded-md bg-neutral-700/80 text-amber-500 hover:text-amber-400 hover:cursor-pointer"
                              >
                                <Edit2 size={16} />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}

          {/* L'éditeur pour l'ajout reste à la fin */}
          {pendingAddItem && (
            <div className="flex items-start gap-2 w-full mt-2">
              <IngredientEditor
                ingredient={{}}
                onConfirm={onConfirmAdd}
                onCancel={onCancelAdd}
              />
            </div>
          )}
          {isAuthenticated && !pendingAddItem && (
            <button
              onClick={onAddIngredientClick}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-amber-600 text-white text-sm hover:bg-amber-700 mt-3 hover:cursor-pointer"
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
