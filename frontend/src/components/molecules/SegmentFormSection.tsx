import React from "react";
import { FormInput } from "@/components/atoms/FormInput";
import { FormTextarea } from "@/components/atoms/FormTextarea";
import { Trash2, Plus } from "lucide-react";
import { PrepTimeFormSection } from "./PrepTimeFormSection";
import type { SegmentWithMeta } from "@/types/payloadBuilder";

interface SegmentFormSectionProps {
  segments: Partial<SegmentWithMeta>[];
  onChange: (segments: Partial<SegmentWithMeta>[]) => void;
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
        segment: { title: "", paragraph: "" },
        segment_prep_time: [],
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
    updated[index] = {
      ...updated[index],
      segment: { ...updated[index].segment, [field]: value },
    };
    onChange(updated);
  };

  const updatePrepTimes = (index: number, prepTimes: any[]) => {
    const updated = [...segments];
    updated[index] = {
      ...updated[index],
      segment_prep_time: prepTimes.map((p) => ({ prep_time: p })),
    };
    onChange(updated);
  };

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
        {segments.map((segment, index) => (
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
              value={segment.segment?.title || ""}
              onChange={(v) => updateSegment(index, "title", v)}
              placeholder="Titre de l'étape"
            />

            <FormTextarea
              label="Paragraphe"
              value={segment.segment?.paragraph || ""}
              onChange={(v) => updateSegment(index, "paragraph", v)}
              placeholder="Description de l'étape"
              rows={3}
            />

            {/* Temps de préparation avant le paragraphe */}
            <PrepTimeFormSection
              prepTimes={
                segment.segment_prep_time?.map((p) => p.prep_time) || []
              }
              title="Temps de préparation de l’étape"
              onChange={(prep) => updatePrepTimes(index, prep)}
            />
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
