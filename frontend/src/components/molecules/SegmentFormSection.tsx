import React from "react";
import { FormInput } from "@/components/atoms/FormInput";
import { FormTextarea } from "@/components/atoms/FormTextarea";
import { Trash2, Plus } from "lucide-react";
import type { SegmentWithPosition } from "@/types";

interface SegmentFormSectionProps {
  segments: Partial<SegmentWithPosition>[];
  onChange: (segments: Partial<SegmentWithPosition>[]) => void;
}

export const SegmentFormSection: React.FC<SegmentFormSectionProps> = ({
  segments,
  onChange,
}) => {
  const addSegment = () => {
    onChange([
      ...segments,
      {
        position: segments.length + 1,
        title: "",
        paragraph: "",
        note: "",
      },
    ]);
  };

  const removeSegment = (index: number) => {
    const updated = segments
      .filter((_, i) => i !== index)
      .map((seg, i) => ({ ...seg, position: i + 1 }));
    onChange(updated);
  };

  const updateSegment = (index: number, field: string, value: any) => {
    const updated = [...segments];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  // Group segments by section
  const groupedSegments = React.useMemo(() => {
    const groups: Record<string, { indices: number[]; segments: Partial<SegmentWithPosition>[] }> = {};

    segments.forEach((segment, index) => {
      const section = segment.section || "Sans groupe";
      if (!groups[section]) {
        groups[section] = { indices: [], segments: [] };
      }
      groups[section].indices.push(index);
      groups[section].segments.push(segment);
    });

    return groups;
  }, [segments]);

  return (
    <div className="p-4 border border-gray-600 rounded-lg bg-[#292929]/50 space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-200">
          Segments (Étapes)
        </h3>
        <button
          onClick={addSegment}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-amber-600 text-white text-sm hover:bg-amber-700 transition-colors hover:cursor-pointer"
        >
          <Plus size={16} />
          Ajouter
        </button>
      </div>

      <div className="space-y-3">
        {Object.entries(groupedSegments).map(([sectionName, { indices }]) => (
          <div key={sectionName} className="space-y-3">
            {/* Section Header */}
            {sectionName !== "Sans groupe" && (
              <div className="flex items-center gap-2 pt-2">
                <div className="h-px bg-amber-600/30 flex-1" />
                <h4 className="text-sm font-semibold text-amber-500 uppercase tracking-wide">
                  {sectionName}
                </h4>
                <div className="h-px bg-amber-600/30 flex-1" />
              </div>
            )}

            {/* Segments in this section */}
            {indices.map((index) => {
              const segment = segments[index];
              return (
          <div
            key={index}
            className="p-4 border border-gray-600 rounded-lg bg-[#292929]/40 space-y-4"
          >
            <div className="flex justify-between items-start gap-3">
              <span className="text-sm font-medium text-amber-500">
                Étape {segment.position}
              </span>
              <button
                onClick={() => removeSegment(index)}
                className="p-2 text-red-400 hover:text-red-300 transition-colors hover:cursor-pointer"
              >
                <Trash2 size={18} />
              </button>
            </div>

            <FormInput
              label="Titre"
              value={segment.title || ""}
              onChange={(v) => updateSegment(index, "title", v)}
              placeholder="Titre de l'étape"
            />

            <FormInput
              label="Section (optionnel)"
              value={segment.section || ""}
              onChange={(v) => updateSegment(index, "section", v)}
              placeholder="Ex: Préparation du tofu, Vinaigrette, Assemblage..."
            />

            <FormTextarea
              label="Paragraphe"
              value={segment.paragraph || ""}
              onChange={(v) => updateSegment(index, "paragraph", v)}
              placeholder="Description de l'étape"
              rows={3}
            />

            <FormTextarea
              label="Note"
              value={segment.note || ""}
              onChange={(v) => updateSegment(index, "note", v)}
              placeholder="Notes sur l'étape..."
              rows={2}
            />
          </div>
              );
            })}
          </div>
        ))}

        {segments.length === 0 && (
          <p className="text-sm text-gray-500 text-center py-6">
            Aucun segment. Cliquez sur "Ajouter" pour commencer.
          </p>
        )}
      </div>
    </div>
  );
};
