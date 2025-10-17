import React, { useState } from "react";
import {
  FileText,
  ChevronDown,
  ChevronRight,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
} from "lucide-react";
import { FormInput } from "@/components/atoms/FormInput";
import { FormTextarea } from "@/components/atoms/FormTextarea";
import { PrepTimeFormSection } from "@/components/molecules/PrepTimeFormSection";
import { PrepTimePayload } from "@/types";

interface FullSegmentEditFields {
  title: string;
  paragraph: string;
  segment_prep_time: PrepTimePayload[];
}

interface SegmentBlockEditableProps {
  block: any;
  expanded: boolean;
  toggleBlock: () => void;
  segments: any[];
  isAuthenticated: boolean;
  checkedItems: Record<string, boolean>;
  toggleChecked: (id: string) => void;
  onConfirmUpdate: (
    segmentId: string,
    fields: FullSegmentEditFields,
  ) => Promise<boolean | void>;
  onDeleteSegment?: (segmentId: string) => Promise<boolean | void>;
  onDeleteBlock?: () => void; // New prop
  pendingAddItem: boolean;
  onConfirmAdd: (fields: FullSegmentEditFields) => void;
  onCancelAdd: () => void;
  onAddSegmentClick: () => void;
}

const SegmentEditor: React.FC<{
  segment: any;
  onConfirm: (fields: FullSegmentEditFields) => void;
  onCancel: () => void;
}> = ({ segment, onConfirm, onCancel }) => {
  const [title, setTitle] = useState(segment.title || "");
  const [paragraph, setParagraph] = useState(segment.paragraph || "");
  const [prepTimes, setPrepTimes] = useState<PrepTimePayload[]>(
    segment.segment_prep_time?.map((p: any) => p.prep_time).filter(Boolean) ||
      [],
  );

  const handleConfirm = () => {
    onConfirm({ title, paragraph, segment_prep_time: prepTimes });
  };

  return (
    <div className="flex-1 w-full flex-col gap-3 p-4 bg-[#2f2f2f] border border-neutral-600 rounded-lg shadow-lg">
      <FormInput
        label="Titre de l'étape"
        value={title}
        onChange={setTitle}
        placeholder="Optionnel"
      />
      <div className="mt-3">
        <FormTextarea
          label="Description de l'étape"
          value={paragraph}
          onChange={setParagraph}
          rows={4}
          required
        />
      </div>
      <div className="mt-4">
        <PrepTimeFormSection
          prepTimes={prepTimes}
          title="Temps de préparation de l'étape"
          onChange={setPrepTimes}
        />
      </div>
      <div className="flex justify-end gap-2 mt-4">
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

export const SegmentBlockEditable: React.FC<SegmentBlockEditableProps> = ({
  block,
  expanded,
  toggleBlock,
  segments,
  isAuthenticated,
  checkedItems,
  toggleChecked,
  onConfirmUpdate,
  onDeleteSegment,
  onDeleteBlock,
  pendingAddItem,
  onConfirmAdd,
  onCancelAdd,
  onAddSegmentClick,
}) => {
  const [editingSegmentId, setEditingSegmentId] = useState<string | null>(null);

  const handleConfirmUpdate = async (
    segmentId: string,
    fields: FullSegmentEditFields,
  ) => {
    const success = await onConfirmUpdate(segmentId, fields);
    if (success !== false) {
      setEditingSegmentId(null);
    }
  };

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
        <div className="flex items-center gap-2">
          {isAuthenticated && onDeleteBlock && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDeleteBlock();
              }}
              className="p-1.5 rounded-md bg-neutral-700/80 text-red-500 hover:text-red-400"
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
        <div className="p-4 space-y-4 text-gray-300">
          {segments.map((seg: any) => {
            const id = seg.segment_id;
            const isEditingThis = editingSegmentId === id;

            return (
              <div key={id} className="flex items-start gap-3 w-full">
                {isEditingThis ? (
                  <SegmentEditor
                    segment={seg}
                    onConfirm={(fields) => handleConfirmUpdate(id, fields)}
                    onCancel={() => setEditingSegmentId(null)}
                  />
                ) : (
                  <>
                    <div className="pt-1">
                      <input
                        type="checkbox"
                        checked={!!checkedItems[id]}
                        onChange={() => toggleChecked(id)}
                        className="accent-amber-500 w-4 h-4 mt-0.5 cursor-pointer"
                      />
                    </div>
                    <div
                      className={`group relative flex-1 border-b border-gray-800 pb-3`}
                    >
                      <div
                        className={
                          checkedItems[id] ? "line-through text-gray-500" : ""
                        }
                      >
                        {seg.title && (
                          <h4 className="font-semibold text-white mb-1">
                            {seg.title}
                          </h4>
                        )}
                        <p className="whitespace-pre-line">{seg.paragraph}</p>
                      </div>
                      {isAuthenticated && (
                        <div className="absolute top-0 right-0 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => onDeleteSegment?.(id)}
                            className="p-1.5 rounded-md bg-neutral-700/80 text-red-500 hover:text-red-400"
                          >
                            <Trash2 size={16} />
                          </button>
                          <button
                            onClick={() => setEditingSegmentId(id)}
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

          {pendingAddItem && (
            <div className="flex items-start gap-3 w-full">
              <SegmentEditor
                segment={{}}
                onConfirm={onConfirmAdd}
                onCancel={onCancelAdd}
              />
            </div>
          )}

          {isAuthenticated && !pendingAddItem && (
            <button
              onClick={onAddSegmentClick}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-amber-600 text-white text-sm hover:bg-amber-700 transition-colors mt-4 hover:cursor-pointer"
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
