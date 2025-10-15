import React, { useCallback } from "react";
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

  // Standardized Inline Edit Props (from parent/usePublicationView)
  editingField: string | null;
  editValues: Record<string, string>;
  startEdit: (fieldId: string, value: string) => void;
  cancelEdit: () => void; 
  updateValue: (fieldId: string, value: string) => void;
  confirmIngredient: (ingredientId: string, field: "quantity" | "unit" | "product") => void;

  // Simplified mutation hooks
  onAddIngredient?: (contentId: string) => Promise<boolean | void>;
  onDeleteIngredient?: (ingredientId: string) => Promise<boolean | void>;
}

// Helper function to safely decode text and handle basic encoding issues
const safeDecodeText = (text: string | null | undefined): string => {
    if (!text) return "";
    let s = String(text);
    // Simple heuristic fix for common backend encoding errors
    s = s.replace(/├e/g, 'é').replace(/├/g, ''); 
    return s.trim();
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
  // Standardized Inline Edit Props
  editingField,
  editValues,
  startEdit,
  cancelEdit,
  updateValue,
  confirmIngredient,
  // Mutation hooks
  onAddIngredient,
  onDeleteIngredient,
}) => {
  const contentId = block.content_id;
  
  // Helper to construct the unique ID for the InlineEditField
  const buildFieldId = useCallback((field: string, id: string) => `${field}-${id}`, []);

  /**
   * Assembles the display string in read mode.
   * FIX: Accesses the unit name directly from the jointure object (ing.ingredient_units?.[0]?.name).
   */
  const getDisplayValue = (ing: any) => {
    // FIX: Accès direct à la propriété 'name' de l'objet Unit
    const unitName = safeDecodeText(ing.ingredient_units?.[0]?.name) || "";
    
    const rawQuantity = String(ing.quantity || '').trim();
    const productName = safeDecodeText(ing.product?.name);
    
    // Concaténer les parties non-vides avec des espaces
    const parts = [rawQuantity, unitName, productName].filter(part => part.length > 0);

    if (parts.length === 0) return "[Ingrédient vide]";
    
    return parts.join(' ');
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
            const quantityFieldId = buildFieldId("quantity", id);
            const unitFieldId = buildFieldId("unit", id);
            const productFieldId = buildFieldId("product", id);

            const unitNameForEdit = safeDecodeText(ing.ingredient_units?.[0]?.name) || "";
            const qtyValue = String(ing.quantity || 0); 
            const productValue = safeDecodeText(ing.product?.name) || "";


            return (
              <div
                key={id}
                className="flex items-start gap-3 border-b border-gray-700 pb-2"
              >
                {/* Checkbox */}
                <div className="pt-1.5">
                  <input
                    type="checkbox"
                    checked={!!checkedItems[id]}
                    onChange={() => toggleChecked(id)}
                    className="accent-amber-500 w-4 h-4"
                  />
                </div>

                {isAuthenticated ? (
                  <div className="flex flex-wrap gap-2 flex-1">
                    {/* Quantity Field */}
                    <InlineEditField
                      fieldId={quantityFieldId}
                      value={qtyValue} 
                      isEditing={editingField === quantityFieldId}
                      editValue={editValues[quantityFieldId] || qtyValue}
                      onStartEdit={() => startEdit(quantityFieldId, qtyValue)}
                      onCancel={cancelEdit}
                      onConfirm={() => confirmIngredient(id, "quantity")}
                      onChange={(v) => updateValue(quantityFieldId, v)}
                      className="min-w-[70px] flex-grow-0"
                    />
                    {/* Unit Field */}
                    <InlineEditField
                      fieldId={unitFieldId}
                      value={unitNameForEdit || '[Unité]'} 
                      isEditing={editingField === unitFieldId}
                      editValue={editValues[unitFieldId] || unitNameForEdit}
                      onStartEdit={() => startEdit(unitFieldId, unitNameForEdit)}
                      onCancel={cancelEdit}
                      onConfirm={() => confirmIngredient(id, "unit")}
                      onChange={(v) => updateValue(unitFieldId, v)}
                      className="min-w-[90px] flex-grow-0"
                    />
                    {/* Product Field (takes remaining space) */}
                    <InlineEditField
                      fieldId={productFieldId}
                      value={productValue || '[Produit]'}
                      isEditing={editingField === productFieldId}
                      editValue={editValues[productFieldId] || productValue}
                      onStartEdit={() => startEdit(productFieldId, productValue)}
                      onCancel={cancelEdit}
                      onConfirm={() => confirmIngredient(id, "product")}
                      onChange={(v) => updateValue(productFieldId, v)}
                      className="flex-1 min-w-[150px]"
                    />
                    
                    {/* Delete button */}
                    <button
                      onClick={() => onDeleteIngredient?.(id)}
                      className="text-red-400 hover:text-red-300 transition-colors self-start p-1.5 mt-1"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ) : (
                  <span
                    className={`flex-1 pt-1.5 ${checkedItems[id] ? "line-through text-gray-500" : ""}`}
                  >
                    {getDisplayValue(ing)}
                  </span>
                )}
              </div>
            );
          })}

          {isAuthenticated && onAddIngredient && (
            <button
              onClick={() => onAddIngredient(contentId)}
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
