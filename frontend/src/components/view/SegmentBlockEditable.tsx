import React, { useCallback } from "react";
import { FileText, ChevronDown, ChevronRight, Plus, Trash2 } from "lucide-react";
import { InlineEditField } from "@/components/view/InlineEditField";

interface SegmentBlockEditableProps {
  block: any;
  expanded: boolean;
  toggleBlock: () => void;
  segments: any[];
  isAuthenticated: boolean;
  checkedItems: Record<string, boolean>;
  toggleChecked: (id: string) => void;

  // Standardized Inline Edit Props (from parent/usePublicationView)
  editingField: string | null;
  editValues: Record<string, string>;
  startEdit: (fieldId: string, value: string) => void;
  cancelEdit: () => void; // Parent handles which field to cancel
  updateValue: (fieldId: string, value: string) => void;
  confirmSegment: (segmentId: string, field: "title" | "paragraph") => void;

  // Simplified mutation hooks (FIX: Updated return type to Promise<boolean | void>)
  onAddSegment?: (contentId: string) => Promise<boolean | void>;
  onDeleteSegment?: (segmentId: string) => Promise<boolean | void>;
}

export const SegmentBlockEditable: React.FC<SegmentBlockEditableProps> = ({
  block,
  expanded,
  toggleBlock,
  segments,
  isAuthenticated,
  checkedItems,
  toggleChecked,
  // Standardized Inline Edit Props
  editingField,
  editValues,
  startEdit,
  cancelEdit,
  updateValue,
  confirmSegment,
  // Mutation hooks
  onAddSegment,
  onDeleteSegment,
}) => {
  const contentId = block.content_id;
  
  // Helper to construct the unique ID for the InlineEditField
  const buildFieldId = useCallback((field: string, id: string) => `${field}-${id}`, []);

  return (
    <div className="border border-gray-700 rounded-lg bg-[#1F1F1F]/80 mb-4 overflow-hidden">
      <header
        className="flex items-center justify-between px-4 py-2 bg-[#2a2a2a]/70 cursor-pointer"
        onClick={toggleBlock}
      >
        <h3 className="text-lg font-semibold flex items-center gap-2 text-white">
          <FileText className="w-5 h-5 text-amber-500" />
          {block.subtitle || "Préparation"}
        </h3>
        {expanded ? (
          <ChevronDown className="w-5 h-5 text-gray-400" />
        ) : (
          <ChevronRight className="w-5 h-5 text-gray-400" />
        )}
      </header>

      {expanded && (
        <div className="p-4 space-y-3 text-gray-300">
          {segments.map((seg: any) => {
            const id = seg.segment_id;
            const titleFieldId = buildFieldId("title", id);
            const paragraphFieldId = buildFieldId("paragraph", id);

            return (
              <div
                key={id}
                className="flex flex-col gap-2 border-b border-gray-700 pb-2"
              >
                {isAuthenticated ? (
                  <>
                    {/* Title Field */}
                    <InlineEditField
                      fieldId={titleFieldId}
                      value={seg.title || ""}
                      isEditing={editingField === titleFieldId}
                      editValue={editValues[titleFieldId] || seg.title || ""}
                      onStartEdit={() => startEdit(titleFieldId, seg.title || "")}
                      onCancel={cancelEdit}
                      onConfirm={() => confirmSegment(id, "title")}
                      onChange={(v) => updateValue(titleFieldId, v)}
                    />
                    {/* Paragraph Field (multiline) */}
                    <InlineEditField
                      fieldId={paragraphFieldId}
                      value={seg.paragraph || ""}
                      isEditing={editingField === paragraphFieldId}
                      editValue={editValues[paragraphFieldId] || seg.paragraph || ""}
                      onStartEdit={() => startEdit(paragraphFieldId, seg.paragraph || "")}
                      onCancel={cancelEdit}
                      onConfirm={() => confirmSegment(id, "paragraph")}
                      onChange={(v) => updateValue(paragraphFieldId, v)}
                      multiline
                    />
                    {/* Delete button (Phase 3 will inject logic) */}
                    <button
                      onClick={() => onDeleteSegment?.(id)}
                      className="text-red-400 hover:text-red-300 transition-colors self-end"
                    >
                      <Trash2 size={16} />
                    </button>
                  </>
                ) : (
                  <span
                    className={
                      checkedItems[id]
                        ? "line-through text-gray-500"
                        : ""
                    }
                  >
                    {seg.paragraph}
                  </span>
                )}
              </div>
            );
          })}

          {isAuthenticated && onAddSegment && (
            <button
              onClick={() => onAddSegment(contentId)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-amber-600 text-white text-sm hover:bg-amber-700 transition-colors hover:cursor-pointer"
            >
              <Plus size={16} />
              Ajouter une étape
            </button>
          )}
        </div>
      )}
    </div>
  );
};
