import React from "react";
import { InlineEditField } from "@/components/view/InlineEditField";
import type { ServingsPayload } from "@/types/payloadBuilder";

interface ContentBlockHeaderEditableProps {
  contentId: string;
  subtitle?: string;
  servings?: ServingsPayload | null;
  isAuthenticated: boolean;
  editingField: string | null;
  editValues: Record<string, string>;
  startEdit: (fieldId: string, value: string) => void;
  cancelEdit: () => void;
  updateValue: (fieldId: string, value: string) => void;
  // Simplified confirm signature to match the centralized dispatcher
  confirmContent: (field: "subtitle" | "servings") => void;
}

export const ContentBlockHeaderEditable: React.FC<
  ContentBlockHeaderEditableProps
> = ({
  contentId,
  subtitle,
  servings,
  isAuthenticated,
  editingField,
  editValues,
  startEdit,
  cancelEdit,
  updateValue,
  confirmContent,
}) => {
  const subtitleFieldId = `subtitle-${contentId}`;
  const servingsFieldId = `servings-${contentId}`;

  const servingsLabel = servings
    ? `${servings.yield || 0} ${servings.value || "portion(s)"}`
    : "";

  return (
    <div className="flex flex-col gap-2 mb-4">
      {isAuthenticated ? (
        <InlineEditField
          fieldId={subtitleFieldId}
          value={subtitle || ""}
          isEditing={editingField === subtitleFieldId}
          editValue={editValues[subtitleFieldId] || subtitle || ""}
          onStartEdit={() => startEdit(subtitleFieldId, subtitle || "")}
          onCancel={cancelEdit}
          onConfirm={() => confirmContent("subtitle")}
          onChange={(v) => updateValue(subtitleFieldId, v)}
          className="text-lg font-semibold text-amber-400"
        />
      ) : (
        subtitle && (
          <h3 className="text-lg font-semibold text-amber-400">{subtitle}</h3>
        )
      )}

      {isAuthenticated ? (
        <div className="flex">
          <span className="mr-2">Rendement:</span>
          <InlineEditField
            fieldId={servingsFieldId}
            value={servingsLabel}
            isEditing={editingField === servingsFieldId}
            editValue={editValues[servingsFieldId] || servingsLabel}
            onStartEdit={() => startEdit(servingsFieldId, servingsLabel)}
            onCancel={cancelEdit}
            // Note: The conversion logic for the complex 'servings' field
            // from string (editValue) to object payload is complex and
            // should ideally be handled in the centralized hook. For now,
            // we use 'servings' as the field name.
            onConfirm={() => confirmContent("servings")}
            onChange={(v) => updateValue(servingsFieldId, v)}
            className="text-gray-300"
          />
        </div>
      ) : (
        servings && (
          <span className="text-gray-400 text-sm">
            Rendement: {servingsLabel}
          </span>
        )
      )}
    </div>
  );
};
