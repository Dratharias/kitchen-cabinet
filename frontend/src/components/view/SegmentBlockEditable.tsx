import React from "react";
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

  // hooks (useSegmentEdit)
  editingField: string | null;
  editValues: Record<string, string>;
  startEdit: (fieldId: string, value: string) => void;
  cancelEdit: (fieldId: string) => void;
  updateValue: (fieldId: string, value: string) => void;
  confirmSegment: (
    segmentId: string,
    field: "title" | "paragraph" | "position"
  ) => void;
  addSegment: () => Promise<void>;
  deleteSegment: (segmentId: string) => Promise<void>;
  isLoading: boolean;
}

export const SegmentBlockEditable: React.FC<SegmentBlockEditableProps> = ({
  block,
  expanded,
  toggleBlock,
  segments,
  isAuthenticated,
  checkedItems,
  toggleChecked,
  editingField,
  editValues,
  startEdit,
  cancelEdit,
  updateValue,
  confirmSegment,
  addSegment,
  deleteSegment,
}) => {
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
          {segments.map((seg: any) => (
            <div
              key={seg.segment_id}
              className="flex flex-col gap-2 border-b border-gray-700 pb-2"
            >
              {isAuthenticated ? (
                <>
                  <InlineEditField
                    fieldId={`title-${seg.segment_id}`}
                    value={seg.title || ""}
                    isEditing={editingField === `title-${seg.segment_id}`}
                    editValue={
                      editValues[`title-${seg.segment_id}`] || seg.title || ""
                    }
                    onStartEdit={() =>
                      startEdit(`title-${seg.segment_id}`, seg.title || "")
                    }
                    onCancel={() => cancelEdit(`title-${seg.segment_id}`)}
                    onConfirm={() =>
                      confirmSegment(seg.segment_id, "title")
                    }
                    onChange={(v) =>
                      updateValue(`title-${seg.segment_id}`, v)
                    }
                  />
                  <InlineEditField
                    fieldId={`paragraph-${seg.segment_id}`}
                    value={seg.paragraph || ""}
                    isEditing={editingField === `paragraph-${seg.segment_id}`}
                    editValue={
                      editValues[`paragraph-${seg.segment_id}`] ||
                      seg.paragraph ||
                      ""
                    }
                    onStartEdit={() =>
                      startEdit(
                        `paragraph-${seg.segment_id}`,
                        seg.paragraph || ""
                      )
                    }
                    onCancel={() => cancelEdit(`paragraph-${seg.segment_id}`)}
                    onConfirm={() =>
                      confirmSegment(seg.segment_id, "paragraph")
                    }
                    onChange={(v) =>
                      updateValue(`paragraph-${seg.segment_id}`, v)
                    }
                    multiline
                  />
                  <button
                    onClick={() => deleteSegment(seg.segment_id)}
                    className="text-red-400 hover:text-red-300 transition-colors self-end"
                  >
                    <Trash2 size={16} />
                  </button>
                </>
              ) : (
                <span
                  className={
                    checkedItems[seg.segment_id]
                      ? "line-through text-gray-500"
                      : ""
                  }
                >
                  {seg.paragraph}
                </span>
              )}
            </div>
          ))}

          {isAuthenticated && (
            <button
              onClick={addSegment}
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
