import React from "react";
import { FormInput } from "@/components/atoms/FormInput";
import { Plus, Trash2 } from "lucide-react";
import { GalleryItem } from "@/types";

interface GalleryFormSectionProps {
  gallery: Partial<GalleryItem>[];
  onChange: (gallery: Partial<GalleryItem>[]) => void;
  label?: string;
}

export const GalleryFormSection: React.FC<GalleryFormSectionProps> = ({
  gallery,
  onChange,
  label = "Galerie",
}) => {
  const addGalleryItem = () => {
    onChange([...(gallery || []), { url: "", label: "" }]);
  };

  const removeGalleryItem = (index: number) => {
    onChange((gallery || []).filter((_, i) => i !== index));
  };

  const updateGalleryItem = (index: number, field: keyof GalleryItem, value: string) => {
    const updated = [...(gallery || [])];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  return (
    <div className="p-4 border border-gray-600 rounded-lg bg-[#292929]/50 space-y-4">
      <div className="flex justify-between items-center">
        <label className="text-sm font-medium text-gray-400">{label}</label>
        <button
          type="button"
          onClick={addGalleryItem}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-amber-600 text-white text-sm hover:bg-amber-700 transition-colors hover:cursor-pointer"
        >
          <Plus size={16} />
          Ajouter
        </button>
      </div>

      {(gallery || []).map((item, index) => (
        <div key={index} className="grid grid-cols-1 md:grid-cols-[1fr,1fr,auto] gap-2 items-end">
          <FormInput
            label="URL de l'image"
            value={item.url || ""}
            onChange={(v) => updateGalleryItem(index, "url", v)}
            placeholder="https://example.com/image.jpg"
          />
          <FormInput
            label="Label (optionnel)"
            value={item.label || ""}
            onChange={(v) => updateGalleryItem(index, "label", v)}
            placeholder="Description de l'image"
          />
          <button
            type="button"
            onClick={() => removeGalleryItem(index)}
            className="p-2 mb-1 text-red-400 hover:text-red-300 transition-colors hover:cursor-pointer"
          >
            <Trash2 size={18} />
          </button>
        </div>
      ))}
    </div>
  );
};
