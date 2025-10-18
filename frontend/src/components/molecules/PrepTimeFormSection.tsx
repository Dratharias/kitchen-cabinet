import React from "react";
import { FormInput } from "@/components/atoms/FormInput";
import { Trash2, Plus } from "lucide-react";
import { PrepTimePayload } from "@/types";

interface PrepTimeFormSectionProps {
  prepTimes: PrepTimePayload[];
  title: string;
  onChange: (prepTimes: PrepTimePayload[]) => void;
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
    const current = { ...updated[index] };

    if (field === "duration") {
      current.duration = Number(value) || 0;
    } else if (field === "style") {
      current.style = { str_value: value, type: "PrepStyle" };
    }

    updated[index] = current;
    onChange(updated);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <label className="text-sm font-medium text-gray-400">{title}</label>
        <button
          type="button"
          onClick={addPrepTime}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-amber-600 text-white text-sm hover:bg-amber-700 transition-colors hover:cursor-pointer"
        >
          <Plus size={16} />
          Ajouter
        </button>
      </div>

      <div className="space-y-2">
        {prepTimes.map((prepTime, index) => (
          <div
            key={index}
            className="grid grid-cols-[1fr,1fr,auto] gap-2 items-end"
          >
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
              placeholder="Préparation, Cuisson..."
            />
            <button
              type="button"
              onClick={() => removePrepTime(index)}
              className="p-2 text-red-400 hover:text-red-300 transition-colors mb-1"
            >
              <Trash2 size={18} />
            </button>
          </div>
        ))}
      </div>

      {prepTimes.length === 0 && (
        <p className="text-xs text-gray-500 text-center py-2">
          Aucun temps de préparation pour cette étape.
        </p>
      )}
    </div>
  );
};
