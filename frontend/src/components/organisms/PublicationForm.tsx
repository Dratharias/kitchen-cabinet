import React, { useState, useEffect } from "react";
import { PublicationFormSection } from "@/components/molecules/PublicationFormSection";
import { ContentFormSection } from "@/components/molecules/ContentFormSection";
import { PayloadBuilder } from "@/services/payloadBuilder";
import { Plus, Trash2 } from "lucide-react";
import { ContentPayload, Publication } from "@/types";

interface PublicationFormProps {
  onSubmit: (payload: any) => void;
  onCancel?: () => void;
  initialData?: Partial<Publication>;
}

export const PublicationForm: React.FC<PublicationFormProps> = ({
  onSubmit,
  onCancel,
  initialData,
}) => {
  const getInitialState = () => {
    const baseState = {
      title: "",
      description: [],
      note: [],
      public: true,
      published: true,
      thumbnail: "",
      contents: [],
    };

    if (!initialData) {
      return baseState;
    }

    const descriptionAsArray: string[] = 
      initialData.description && initialData.description.length > 0
        ? (Array.isArray(initialData.description) 
            ? initialData.description 
            : [initialData.description])
        : [];
        
    const noteAsArray: string[] = 
      initialData.note && initialData.note.length > 0
        ? (Array.isArray(initialData.note) 
            ? initialData.note 
            : [initialData.note])
        : [];

    return { ...baseState, ...initialData, description: descriptionAsArray, note: noteAsArray };
  };

  const [formData, setFormData] = useState(getInitialState);

  useEffect(() => {
    setFormData(getInitialState() as any);
  }, [initialData]);

  const handlePublicationChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const addContent = () => {
    setFormData((prev: any) => ({
      ...prev,
      contents: [
        ...(prev.contents || []),
        {
          total_prep_time: 0,
          servings: { yield: 1, value: "portion" },
          subtitle: "",
          content_ingredients: [],
          content_segments: [],
          content_prep_times: [],
          gallery: [],
        },
      ],
    }));
  };

  const removeContent = (index: number) => {
    setFormData((prev: any) => ({
      ...prev,
      contents: (prev.contents || []).filter((_: any, i: number) => i !== index),
    }));
  };

  const updateContent = (index: number, content: Partial<ContentPayload>) => {
    setFormData((prev: any) => ({
      ...prev,
      contents: (prev.contents || []).map((c: any, i: number) => (i === index ? content : c)),
    }));
  };

  const handleSubmit = () => {
    const builder = new PayloadBuilder();
    const payloadData = {
      ...formData,
      thumbnail: formData.thumbnail || undefined,
    };

    const payload = builder.build(
      initialData ? "update" : "create",
      initialData?.publication_id || "new-publication",
      payloadData,
      initialData as Publication | undefined,
    );
    onSubmit(payload);
  };

  const isValidForm = (): boolean => {
    if (!formData.title || !formData.title.trim()) return false;
    if (!formData.description || formData.description.join("").trim() === "") return false;

    if (!formData.contents || formData.contents.length === 0) return false;

    for (const content of formData.contents) {
      if (!content.content_ingredients || content.content_ingredients.length === 0) return false;
      for (const ing of content.content_ingredients) {
        if (!ing.product?.name?.trim()) return false;
        if (ing.quantity === undefined || ing.quantity === null || ing.quantity < 0) return false;
      }
      if (!content.content_segments || content.content_segments.length === 0) return false;
      for (const seg of content.content_segments) {
        if (!seg.segment?.paragraph?.trim()) return false;
      }
      if (!content.content_prep_times || content.content_prep_times.length === 0) return false;
      for (const pt of content.content_prep_times) {
        if (pt.duration === undefined || pt.duration <= 0) return false;
        if (!pt.style?.str_value?.trim()) return false;
      }
      if (!content.servings || content.servings.yield === undefined || content.servings.yield <= 0) {
        return false;
      }
    }

    return true;
  };

  const isValid = isValidForm();

  return (
    <div className="space-y-8">
      <div className="bg-[#2a2a2a]/70 border border-neutral-700 rounded-xl p-6">
        <PublicationFormSection
          title={formData.title || ""}
          description={formData.description || []}
          note={formData.note || []}
          isPublic={formData.public || false}
          isPublished={formData.published || false}
          thumbnail={formData.thumbnail || ""}
          onChange={handlePublicationChange}
        />
      </div>

      <div className="space-y-4 px-4 py-6 bg-[#2a2a2a]/20 rounded-md border border-white/5">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-200">
            Contenus (Variantes/Recettes)
          </h3>
          <button
            onClick={addContent}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-amber-600 text-white text-sm hover:bg-amber-700 transition-colors hover:cursor-pointer"
          >
            <Plus size={16} />
            Ajouter un contenu
          </button>
        </div>

        {(formData.contents || []).map((content: any, index: number) => (
          <div
            key={index}
            className="relative bg-[#2a2a2a]/70 border border-neutral-700 rounded-xl p-6"
          >
            <button
              onClick={() => removeContent(index)}
              className="absolute top-4 right-4 p-2 text-red-400 hover:text-red-300 transition-colors hover:cursor-pointer"
            >
              <Trash2 size={18} />
            </button>
            <ContentFormSection
              content={content}
              onChange={(updated) => updateContent(index, updated)}
              index={index}
            />
          </div>
        ))}

        {(!formData.contents || formData.contents.length === 0) && (
          <p className="text-sm text-gray-500 text-center py-6 bg-[#2a2a2a]/70 border border-neutral-700 rounded-xl hover:cursor-pointer">
            Aucun contenu. Cliquez sur "Ajouter un contenu" pour commencer.
          </p>
        )}
      </div>

      <div className="flex gap-3 justify-end">
        {onCancel && (
          <button
            onClick={onCancel}
            className="px-5 py-2.5 rounded-md border border-neutral-700 text-gray-300 text-sm font-medium hover:bg-[#333333] transition-colors hover:cursor-pointer"
          >
            Annuler
          </button>
        )}
        <button
          onClick={handleSubmit}
          disabled={!isValid}
          className={`px-5 py-2.5 rounded-md text-white text-sm font-medium transition-colors ${
            isValid
              ? "bg-amber-600 text-white hover:bg-amber-700 hover:cursor-pointer"
              : "bg-[#292929] border border-neutral-700 text-gray-300 cursor-not-allowed"
          }`}
        >
          {initialData ? "Sauvegarder les modifications" : "Créer la publication"}
        </button>
      </div>
    </div>
  );
};