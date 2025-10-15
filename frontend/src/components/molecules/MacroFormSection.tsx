import React from "react";
import { FormInput } from "@/components/atoms/FormInput";
import type { MacroPayload } from "@/types/payloadBuilder";

interface MacroFormSectionProps {
  macro: Partial<MacroPayload> | null;
  onChange: (macro: Partial<MacroPayload> | null) => void;
}

export const MacroFormSection: React.FC<MacroFormSectionProps> = ({
  macro,
  onChange,
}) => {
  const updateMacro = (field: keyof MacroPayload, value: number) => {
    onChange({
      ...(macro || {}),
      [field]: value,
    });
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-200">Macros</h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-x-4 gap-y-3">
        <FormInput
          label="Calories"
          type="number"
          value={String(macro?.calories || 0)}
          onChange={(v) => updateMacro("calories", Number(v))}
          placeholder="0"
        />
        <FormInput
          label="Protéines"
          type="number"
          value={String(macro?.protein || 0)}
          onChange={(v) => updateMacro("protein", Number(v))}
          placeholder="0"
        />
        <FormInput
          label="Fibres"
          type="number"
          value={String(macro?.fiber || 0)}
          onChange={(v) => updateMacro("fiber", Number(v))}
          placeholder="0"
        />
        <FormInput
          label="Sucre"
          type="number"
          value={String(macro?.carbs || 0)}
          onChange={(v) => updateMacro("carbs", Number(v))}
          placeholder="0"
        />
        <FormInput
          label="Gras saturés"
          type="number"
          value={String(macro?.saturated || 0)}
          onChange={(v) => updateMacro("saturated", Number(v))}
          placeholder="0"
        />
        <FormInput
          label="Gras trans"
          type="number"
          value={String(macro?.trans || 0)}
          onChange={(v) => updateMacro("trans", Number(v))}
          placeholder="0"
        />
        <FormInput
          label="Caféine"
          type="number"
          value={String(macro?.caffein || 0)}
          onChange={(v) => updateMacro("caffein", Number(v))}
          placeholder="0"
        />
        <FormInput
          label="Alcool"
          type="number"
          value={String(macro?.alcohol || 0)}
          onChange={(v) => updateMacro("alcohol", Number(v))}
          placeholder="0"
        />
      </div>
    </div>
  );
};
