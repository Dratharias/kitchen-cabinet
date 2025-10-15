import React from "react";
import { FormInput } from "@/components/atoms/FormInput";
import { Trash2, Plus } from "lucide-react";
import type { PrepTimePayload } from "@/types/payloadBuilder";

interface PrepTimeFormSectionProps {
  prepTimes: Partial<PrepTimePayload>[];
  title: string;
  onChange: (prepTimes: Partial<PrepTimePayload>[]) => void;
}

export const PrepTimeFormSection: React.FC<PrepTimeFormSectionProps> = ({
  prepTimes,
  title,
  onChange,
}) => {
  const addPrepTime = () => {
    onChange([
      ...prepTimes,
      { duration: 0, style: { str_value: "", type: "PrepStyle" } },
    ]);
  };

  const removePrepTime = (index: number) => {
    onChange(prepTimes.filter((_, i) => i !== index));
  };

  const updatePrepTime = (index: number, field: string, value: any) => {
    const updated = [...prepTimes];
    if (field === "duration") {
      updated[index] = { ...updated[index], duration: Number(value) || 0 };
    } else if (field === "style") {
      updated[index] = {
        ...updated[index],
        style: { str_value: value, type: "PrepStyle" },
      };
    }
    onChange(updated);
  };

  return (
    <div className="p-4 border border-gray-600 rounded-lg bg-[#292929]/50 space-y-4">
      <div className="flex justify-between items-center">
        <label className="text-sm font-medium text-gray-400">{title}</label>
        <button
          onClick={addPrepTime}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-amber-600 text-white text-sm hover:bg-amber-700 transition-colors hover:cursor-pointer"
        >
          <Plus size={16} />
          Ajouter
        </button>
      </div>

      {prepTimes.map((prepTime, index) => (
        <div key={index} className="flex gap-2">
          <FormInput
            label="Durée (min)"
            type="number"
            value={String(prepTime.duration || 0)}
            onChange={(v) => updatePrepTime(index, "duration", v)}
            placeholder="0"
          />
          <FormInput
            label="Style"
            value={prepTime.style?.str_value || ""}
            onChange={(v) => updatePrepTime(index, "style", v)}
            placeholder="Préparation, Cuisson, Repos..."
          />
          <button
            onClick={() => removePrepTime(index)}
            className="mt-6 p-2 text-red-400 hover:text-red-300 transition-colors hover:cursor-pointer"
          >
            <Trash2 size={18} />
          </button>
        </div>
      ))}

      {prepTimes.length === 0 && (
        <p className="text-sm text-gray-500 text-center py-4">
          Aucun temps de préparation. Cliquez sur "Ajouter" pour commencer.
        </p>
      )}
    </div>
  );
};
