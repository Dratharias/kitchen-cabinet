import React from "react";
import { FormInput } from "../atoms/FormInput";
import { FormTextarea } from "../atoms/FormTextarea";
import { IngredientFormSection } from "./IngredientFormSection";
import { SegmentFormSection } from "./SegmentFormSection";
import { GalleryFormSection } from "./GalleryFormSection";
import { ContentPayload } from "@/types";

interface ContentFormSectionProps {
  content: Partial<ContentPayload>;
  onChange: (content: Partial<ContentPayload>) => void;
  index: number;
}

export const ContentFormSection: React.FC<ContentFormSectionProps> = ({
  content,
  onChange,
  index,
}) => {
  const handleFieldChange = (field: string, value: any) => {
    onChange({ ...content, [field]: value });
  };

  return (
    <div className="space-y-6">
      <h4 className="text-md font-semibold text-amber-500">
        Contenu #{index + 1}
      </h4>

      <FormInput
        label="Sous-titre"
        value={content.subtitle || ""}
        onChange={(v) => handleFieldChange("subtitle", v)}
        placeholder="Sous-titre du contenu"
      />

      <FormTextarea
        label="Note du contenu"
        value={content.note || ""}
        onChange={(v) => handleFieldChange("note", v)}
        placeholder="Notes sur ce contenu..."
        rows={2}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormInput
          label="Portions (nombre)"
          type="number"
          value={content.serving_yield?.toString() || ""}
          onChange={(v) =>
            handleFieldChange("serving_yield", v ? Number(v) : null)
          }
          placeholder="Nombre"
        />
        <FormInput
          label="Portions (unité)"
          value={content.serving_value || ""}
          onChange={(v) => handleFieldChange("serving_value", v || null)}
          placeholder="tasse, portion..."
        />
      </div>

      <FormInput
        label="Temps de préparation total (min)"
        type="number"
        value={String(content.total_prep_time || 0)}
        onChange={(v) => handleFieldChange("total_prep_time", Number(v))}
        placeholder="0"
      />

      <FormTextarea
        label="Note sur le temps de préparation"
        value={content.prep_time_note || ""}
        onChange={(v) => handleFieldChange("prep_time_note", v || null)}
        placeholder="Détails sur le temps de préparation..."
        rows={2}
      />

      <GalleryFormSection
        gallery={content.gallery || []}
        onChange={(gallery) => handleFieldChange("gallery", gallery)}
        label="Galerie du Contenu"
      />

      <IngredientFormSection
        ingredients={content.ingredients || []}
        onChange={(ingredients) => handleFieldChange("ingredients", ingredients)}
      />

      <SegmentFormSection
        segments={content.segments || []}
        onChange={(segments) => handleFieldChange("segments", segments)}
      />
    </div>
  );
};
