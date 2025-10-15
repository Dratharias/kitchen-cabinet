import React from "react";
import { FormInput } from "@/components/atoms/FormInput";
import { IngredientFormSection } from "@/components/molecules/IngredientFormSection";
import { SegmentFormSection } from "@/components/molecules/SegmentFormSection";
import { GalleryFormSection } from "@/components/molecules/GalleryFormSection";
import { PrepTimeFormSection } from "@/components/molecules/PrepTimeFormSection";
import type { ContentPayload } from "@/types/payloadBuilder";

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

  const servings =
    typeof content.servings === "object"
      ? content.servings
      : content.servings
        ? { yield: content.servings, value: "" }
        : null;

  return (
    <div className="space-y-6">
      <h4 className="text-md font-semibold text-amber-500">
        Contenu #{index + 1}
      </h4>

      <div className="grid grid-cols-3 gap-4">
        <FormInput
          label="Sous-titre"
          value={content.subtitle || ""}
          onChange={(v) => handleFieldChange("subtitle", v)}
          placeholder="Sous-titre du contenu"
        />
        <FormInput
          label="Portions (nombre)"
          type="number"
          value={servings?.yield?.toString() || ""}
          onChange={(v) =>
            handleFieldChange(
              "servings",
              v ? { yield: Number(v), value: servings?.value || "" } : null,
            )
          }
          placeholder="Nombre"
        />
        <FormInput
          label="Portions (unité)"
          value={servings?.value || ""}
          onChange={(v) =>
            handleFieldChange("servings", {
              yield: servings?.yield || 1,
              value: v,
            })
          }
          placeholder="tasse, portion..."
        />
      </div>

      <PrepTimeFormSection
        prepTimes={content.content_prep_times || []}
        title={"Temps de préparation du contenu"}
        onChange={(prepTimes) =>
          handleFieldChange("content_prep_times", prepTimes)
        }
      />

      <GalleryFormSection
        gallery={content.gallery || []}
        onChange={(gallery) => handleFieldChange("gallery", gallery)}
      />

      <IngredientFormSection
        ingredients={content.content_ingredients || []}
        onChange={(ingredients) =>
          handleFieldChange("content_ingredients", ingredients)
        }
      />

      <SegmentFormSection
        segments={content.content_segments || []}
        onChange={(segments) => handleFieldChange("content_segments", segments)}
      />
    </div>
  );
};
