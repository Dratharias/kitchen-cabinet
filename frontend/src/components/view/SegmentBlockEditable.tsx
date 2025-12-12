import React, { useState, useMemo } from "react";
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
  section: string;
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
  onDeleteBlock?: () => void;
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
  const [section, setSection] = useState(segment.section || "");
  const [prepTimes, setPrepTimes] = useState<PrepTimePayload[]>(
    segment.segment_prep_time?.map((p: any) => p.prep_time).filter(Boolean) ||
      [],
  );

  const handleConfirm = () => {
    onConfirm({ title, paragraph, segment_prep_time: prepTimes, section });
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
        <FormInput
          label="Groupe / Section (optionnel)"
          value={section}
          onChange={setSection}
          placeholder="Ex: Préparation, Cuisson, Assemblage..."
        />
      </div>
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
          className="p-2 rounded-md text-red-500 bg-neutral-700/60 hover:text-red-400 hover:cursor-pointer"
        >
          <X size={18} />
        </button>
        <button
          onClick={handleConfirm}
          className="p-2 rounded-md text-green-500 bg-neutral-700/60 hover:text-green-400 hover:cursor-pointer"
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

  // Normalize segments: flatten nested structure from backend
  const normalizedSegments = useMemo(() => {
    return segments.map((seg: any) => {
      // If segment is nested (from backend), flatten it
      if (seg.segment) {
        return {
          segment_id: seg.segment_id,
          position: seg.position,
          title: seg.segment.title,
          paragraph: seg.segment.paragraph,
          note: seg.segment.note,
          section: seg.segment.section,
        };
      }
      // Already flat (from form state)
      return seg;
    });
  }, [segments]);

  const handleConfirmUpdate = async (
    segmentId: string,
    fields: FullSegmentEditFields,
  ) => {
    const success = await onConfirmUpdate(segmentId, fields);
    if (success !== false) {
      setEditingSegmentId(null);
    }
  };

  // Regroupement par section
  const groupedSegments = useMemo(() => {
    const groups = new Map<string | null, any[]>();

    for (const seg of normalizedSegments) {
      const section = seg.section || null;
      if (!groups.has(section)) {
        groups.set(section, []);
      }
      groups.get(section)!.push(seg);
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
  }, [segments]);

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
        <div className="p-4 space-y-4 text-gray-300">
          {normalizedSegments.length === 0 && (
            <p className="text-gray-500 text-sm">Aucune étape disponible</p>
          )}

          {groupedSegments.map((group, idx) => (
            <div key={group.title || `group-${idx}`}>
              {group.title && (
                <div className="flex items-center gap-2 mt-4 mb-3 first:mt-0">
                  <div className="h-px bg-amber-600/30 flex-1" />
                  <h4 className="text-sm font-semibold text-amber-500 uppercase tracking-wide px-2">
                    {group.title}
                  </h4>
                  <div className="h-px bg-amber-600/30 flex-1" />
                </div>
              )}

              {group.items.map((seg: any, segIdx: number) => {
                const id = seg.segment_id;
                const isEditingThis = editingSegmentId === id;
                const isFirst = segIdx === 0;

                return (
                  <div key={id} className={`flex items-start w-full ${isFirst ? "-mt-1" : ""}`}>
                    {isEditingThis ? (
                      <SegmentEditor
                        segment={seg}
                        onConfirm={(fields) => handleConfirmUpdate(id, fields)}
                        onCancel={() => setEditingSegmentId(null)}
                      />
                    ) : (
                      <div
                        className={`flex items-center border-b border-gray-800 w-full ${
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
                              {seg.title && <strong>{seg.title}: </strong>}
                              {seg.paragraph}
                            </p>
                          </div>

                          {isAuthenticated && (
                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity ms-2">
                              <button
                                onClick={() => onDeleteSegment?.(id)}
                                className="p-1.5 rounded-md bg-neutral-700/80 text-red-500 hover:text-red-400 hover:cursor-pointer"
                              >
                                <Trash2 size={16} />
                              </button>
                              <button
                                onClick={() => setEditingSegmentId(id)}
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
