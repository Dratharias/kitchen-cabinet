import React from "react";
import { FormInput } from "@/components/atoms/FormInput";
import { FormTextarea } from "@/components/atoms/FormTextarea";
import { FormCheckbox } from "@/components/atoms/FormCheckbox";
import { GalleryFormSection } from "@/components/molecules/GalleryFormSection";

interface PublicationFormSectionProps {
  title: string;
  description: string;
  note: string;
  isPublic: boolean;
  isPublished: boolean;
  thumbnail?: string;
  gallery?: string[];
  onChange: (field: string, value: any) => void;
}

export const PublicationFormSection: React.FC<PublicationFormSectionProps> = ({
  title,
  description,
  note,
  isPublic,
  isPublished,
  thumbnail,
  gallery = [],
  onChange,
}) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-200">Publication</h3>

      <FormInput
        label="Titre"
        value={title}
        onChange={(v) => onChange("title", v)}
        placeholder="Titre de la recette"
        required
      />

      <FormTextarea
        label="Description"
        value={description}
        onChange={(v) => onChange("description", v)}
        placeholder="Description de la recette"
        rows={3}
      />

      <FormTextarea
        label="Note"
        value={note}
        onChange={(v) => onChange("note", v)}
        placeholder="Notes additionnelles"
        rows={2}
      />

      <FormInput
        label="Thumbnail (URL)"
        value={thumbnail || ""}
        onChange={(v) => onChange("thumbnail", v)}
        placeholder="https://example.com/image.jpg"
      />

      <GalleryFormSection
        gallery={gallery}
        onChange={(gallery) => onChange("gallery", gallery)}
      />

      <div className="flex gap-4">
        <FormCheckbox
          label="Public"
          checked={isPublic}
          onChange={(v) => onChange("public", v)}
        />
        <FormCheckbox
          label="Publié"
          checked={isPublished}
          onChange={(v) => onChange("published", v)}
        />
      </div>
    </div>
  );
};
