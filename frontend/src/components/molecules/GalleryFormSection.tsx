import React from "react";
import { FormInput } from "@/components/atoms/FormInput";
import { Plus, Trash2 } from "lucide-react";

interface GalleryFormSectionProps {
  gallery: string[];
  onChange: (gallery: string[]) => void;
  label?: string;
}

export const GalleryFormSection: React.FC<GalleryFormSectionProps> = ({
  gallery,
  onChange,
  label = "Galerie",
}) => {
  const addGalleryItem = () => {
    onChange([...gallery, ""]);
  };

  const removeGalleryItem = (index: number) => {
    onChange(gallery.filter((_, i) => i !== index));
  };

  const updateGalleryItem = (index: number, value: string) => {
    const updated = [...gallery];
    updated[index] = value;
    onChange(updated);
  };

  return (
    <div className="p-4 border border-gray-600 rounded-lg bg-[#292929]/50 space-y-4">
      <div className="flex justify-between items-center">
        <label className="text-sm font-medium text-gray-400">{label}</label>
        <button
          onClick={addGalleryItem}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-amber-600 text-white text-sm hover:bg-amber-700 transition-colors hover:cursor-pointer"
        >
          <Plus size={16} />
          Ajouter
        </button>
      </div>

      {gallery.map((url, index) => (
        <div key={index} className="flex gap-2">
          <FormInput
            value={url}
            onChange={(v) => updateGalleryItem(index, v)}
            placeholder="https://example.com/image.jpg"
          />
          <button
            onClick={() => removeGalleryItem(index)}
            className="p-2 text-red-400 hover:text-red-300 transition-colors hover:cursor-pointer"
          >
            <Trash2 size={18} />
          </button>
        </div>
      ))}
    </div>
  );
};
