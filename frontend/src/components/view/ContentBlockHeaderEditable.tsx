import React from "react";
import { InlineEditField } from "./InlineEditField";
import type { ServingsPayload } from "@/types/payloadBuilder";
import { FormInput } from "@/components/atoms/FormInput";
import { Check, X } from "lucide-react"; // Import icons

interface ContentBlockHeaderEditableProps {
  contentId: string;
  subtitle?: string;
  servings?: ServingsPayload | null;
  isAuthenticated: boolean;
  editingField: string | null;
  editValues: Record<string, any>; // Supporte l'objet servings
  startEdit: (fieldId: string, value: any) => void;
  cancelEdit: () => void;
  updateValue: (fieldId: string, value: any) => void;
  confirmContent: (field: "subtitle" | "servings") => void;
}

export const ContentBlockHeaderEditable: React.FC<
  ContentBlockHeaderEditableProps
> = ({
  contentId,
  servings,
  isAuthenticated,
  editingField,
  editValues,
  startEdit,
  cancelEdit,
  updateValue,
  confirmContent,
}) => {
  const servingsFieldId = `servings-${contentId}`;
  const isEditing = editingField === servingsFieldId;

  const servingsLabel = servings
    ? `${servings.yield || 0} ${servings.value || "portion(s)"}`
    : "";

  const currentEditValue = editValues[servingsFieldId] || servings;

  if (!isAuthenticated) {
    return servings ? (
      <span className="text-gray-400 text-sm">Rendement: {servingsLabel}</span>
    ) : null;
  }

  return (
    <div className="flex flex-col gap-2 mb-4">
      <div className="flex items-center gap-2">
        <span className="text-gray-400 text-sm">Rendement:</span>
        {isEditing ? (
          <div className="flex items-center gap-2">
            <div className="w-24">
              <FormInput
                type="number"
                value={currentEditValue?.yield?.toString() || ""}
                onChange={(val) =>
                  updateValue(servingsFieldId, {
                    ...currentEditValue,
                    yield: Number(val),
                  })
                }
                placeholder="Nb."
              />
            </div>
            <div className="w-32">
              <FormInput
                value={currentEditValue?.value || ""}
                onChange={(val) =>
                  updateValue(servingsFieldId, {
                    ...currentEditValue,
                    value: val,
                  })
                }
                placeholder="Unité"
              />
            </div>
            {/* Add buttons here */}
            <button
              onClick={() => confirmContent("servings")}
              className="p-2 rounded-md text-green-500 bg-neutral-700/60 hover:text-green-400 transition-colors hover:cursor-pointer"
            >
              <Check size={18} />
            </button>
            <button
              onClick={cancelEdit}
              className="p-2 rounded-md text-red-500 bg-neutral-700/60 hover:text-red-400 transition-colors hover:cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        ) : (
          <InlineEditField
            fieldId={servingsFieldId}
            value={servingsLabel}
            isEditing={isEditing}
            editValue={servingsLabel} // La logique d'affichage est gérée par le JSX ci-dessus
            onStartEdit={() => startEdit(servingsFieldId, servings)}
            onCancel={cancelEdit}
            onConfirm={() => confirmContent("servings")}
            onChange={() => {}} // Non utilisé ici, car géré par les FormInput
            className="text-gray-300"
          />
        )}
      </div>
    </div>
  );
};
