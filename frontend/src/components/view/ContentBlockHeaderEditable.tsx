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
  cancelEdit: (fieldId: string) => void;
  updateValue: (fieldId: string, value: string) => void;
  confirmContent: (contentId: string, field: "subtitle" | "servings") => void;
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
  const servingsLabel = servings
    ? `${servings.yield} ${servings.value || "portion(s)"}`
    : "";

  return (
    <div className="flex flex-col gap-2 mb-4">
      {isAuthenticated ? (
        <InlineEditField
          fieldId={`subtitle-${contentId}`}
          value={subtitle || ""}
          isEditing={editingField === `subtitle-${contentId}`}
          editValue={editValues[`subtitle-${contentId}`] || subtitle || ""}
          onStartEdit={() => startEdit(`subtitle-${contentId}`, subtitle || "")}
          onCancel={() => cancelEdit(`subtitle-${contentId}`)}
          onConfirm={() => confirmContent(contentId, "subtitle")}
          onChange={(v) => updateValue(`subtitle-${contentId}`, v)}
          className="text-lg font-semibold text-amber-400"
        />
      ) : (
        subtitle && <h3 className="text-lg font-semibold text-amber-400">{subtitle}</h3>
      )}

      {isAuthenticated ? (
        <InlineEditField
          fieldId={`servings-${contentId}`}
          value={servingsLabel}
          isEditing={editingField === `servings-${contentId}`}
          editValue={editValues[`servings-${contentId}`] || servingsLabel}
          onStartEdit={() => startEdit(`servings-${contentId}`, servingsLabel)}
          onCancel={() => cancelEdit(`servings-${contentId}`)}
          onConfirm={() => confirmContent(contentId, "servings")}
          onChange={(v) => updateValue(`servings-${contentId}`, v)}
          className="text-gray-300"
        />
      ) : (
        servings && (
          <span className="text-gray-400 text-sm">{servingsLabel}</span>
        )
      )}
    </div>
  );
};
