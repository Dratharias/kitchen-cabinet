import React, { useState, useEffect } from "react";
import { Image as ImageIcon } from "lucide-react";
import { FormInput } from "../atoms/FormInput";
import { FormTextarea } from "../atoms/FormTextarea";
import { FormCheckbox } from "../atoms/FormCheckbox";
import { ImageBrowser } from "./ImageBrowser";
import { ImagesService } from "@/services/images";

interface PublicationFormSectionProps {
  title: string;
  description: string[];
  note: string[];
  isPublic: boolean;
  isPublished: boolean;
  thumbnail?: string;
  onChange: (field: string, value: any) => void;
}

export const PublicationFormSection: React.FC<PublicationFormSectionProps> = ({
  title,
  description,
  note,
  isPublic,
  isPublished,
  thumbnail,
  onChange,
}) => {
  const [showImageBrowser, setShowImageBrowser] = useState(false);

  // Set default image if no thumbnail is set
  useEffect(() => {
    if (!thumbnail) {
      onChange("thumbnail", ImagesService.getDefaultImageUrl());
    }
  }, []);

  const handleImageSelect = (imageUrl: string) => {
    onChange("thumbnail", imageUrl);
  };

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
        value={
          Array.isArray(description) ? description.join("\n") : description
        }
        onChange={(v) => onChange("description", v.split("\n"))}
        placeholder="Description de la recette"
        rows={3}
      />

      <FormTextarea
        label="Note"
        value={Array.isArray(note) ? note.join("\n") : note}
        onChange={(v) => onChange("note", v.split("\n"))}
        placeholder="Notes additionnelles"
        rows={2}
      />

      {/* Image Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Image de couverture
        </label>
        <div className="flex gap-3">
          {/* Image Preview */}
          {thumbnail && (
            <div className="w-32 h-32 rounded-lg overflow-hidden border-2 border-neutral-600 flex-shrink-0">
              <img
                src={thumbnail}
                alt="Thumbnail preview"
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col gap-2 justify-center">
            <button
              type="button"
              onClick={() => setShowImageBrowser(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-md bg-neutral-700 text-gray-200 hover:bg-neutral-600 transition-colors"
            >
              <ImageIcon size={18} />
              Parcourir la bibliothèque
            </button>
            <p className="text-xs text-gray-500">
              {thumbnail?.includes('default.png')
                ? "Image par défaut sélectionnée"
                : "Image personnalisée"}
            </p>
          </div>
        </div>
      </div>

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

      {/* Image Browser Modal */}
      {showImageBrowser && (
        <ImageBrowser
          currentImage={thumbnail}
          onSelect={handleImageSelect}
          onClose={() => setShowImageBrowser(false)}
        />
      )}
    </div>
  );
};
