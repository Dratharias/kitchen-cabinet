import React, { useState } from "react";
import { PublicationFormSection } from "@/components/molecules/PublicationFormSection";
import { ContentFormSection } from "@/components/molecules/ContentFormSection";
import { PayloadBuilder } from "@/services/payloadBuilder";
import type { ContentPayload } from "@/types/payloadBuilder";
import { Plus, Trash2 } from "lucide-react";

interface PublicationFormProps {
  onSubmit: (payload: any) => void;
  onCancel?: () => void;
}

export const PublicationForm: React.FC<PublicationFormProps> = ({
  onSubmit,
  onCancel,
}) => {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    note: "",
    public: true,
    published: true,
    thumbnail: "",
    gallery: [] as string[],
    contents: [] as Partial<ContentPayload>[],
  });

  const handlePublicationChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const addContent = () => {
    setFormData((prev) => ({
      ...prev,
      contents: [
        ...prev.contents,
        {
          total_prep_time: 0,
          servings: { yield: 1, value: "portion" }, // Initialisation au format objet
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
    setFormData((prev) => ({
      ...prev,
      contents: prev.contents.filter((_, i) => i !== index),
    }));
  };

  const updateContent = (index: number, content: Partial<ContentPayload>) => {
    setFormData((prev) => ({
      ...prev,
      contents: prev.contents.map((c, i) => (i === index ? content : c)),
    }));
  };

  const handleSubmit = () => {
    const builder = new PayloadBuilder();

    const data = {
      title: formData.title,
      // FIX: La description est passée en chaîne, le builder la convertit en tableau
      description: formData.description, 
      note: formData.note,
      public: formData.public,
      published: formData.published,
      thumbnail: formData.thumbnail || undefined,
      // FIX: Gallery est passée mais sera ignorée par l'orchestrator (N-N)
      gallery: formData.gallery.length > 0 ? formData.gallery : undefined, 
      contents: formData.contents,
    };

    // La validation est faite avant l'appel à handleSubmit grâce à isValidForm()
    const payload = builder.build("create", "publication", data);
    onSubmit(payload);
  };

  /**
   * Valide que le formulaire contient les données minimales et cohérentes.
   */
  const isValidForm = (): boolean => {
    // Validation des champs de publication de base (title, description, note)
    if (!formData.title.trim()) return false;
    if (!formData.description.trim()) return false;
    if (!formData.note.trim()) return false;
    
    // Validation des Contenus
    if (formData.contents.length === 0) return false;

    for (const content of formData.contents) {
      
      // Validation des Ingrédients
      if (
        !content.content_ingredients ||
        content.content_ingredients.length === 0
      )
        return false;

      for (const ing of content.content_ingredients) {
        if (!ing.product?.name?.trim()) return false;
        // La quantité peut être 0 si l'unité est "au goût" ou "pincée", mais doit exister
        if (ing.quantity === undefined || ing.quantity === null || ing.quantity < 0) return false; 
        if (!ing.ingredient_units?.[0]?.unit?.name?.trim()) return false;
      }

      // Validation des Segments
      if (!content.content_segments || content.content_segments.length === 0)
        return false;

      for (const seg of content.content_segments) {
        if (!seg.segment?.paragraph?.trim()) return false;
      }
      
      // Validation du Temps de Préparation
      if (
        !content.content_prep_times ||
        content.content_prep_times.length === 0
      )
        return false;

      for (const pt of content.content_prep_times) {
        if (pt.duration === undefined || pt.duration <= 0) return false;
        if (!pt.style?.str_value?.trim()) return false;
      }
      
      // Validation des Servings
      if (!content.servings || content.servings.yield === undefined || content.servings.yield <= 0) {
          // Si le yield n'est pas fourni ou est invalide, la validation échoue.
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
          title={formData.title}
          description={formData.description}
          note={formData.note}
          isPublic={formData.public}
          isPublished={formData.published}
          thumbnail={formData.thumbnail}
          gallery={formData.gallery}
          onChange={handlePublicationChange}
        />
      </div>

      <div className="space-y-4 px-4 py-6 bg-[#2a2a2a]/20 rounded-md border border-white/5">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-200">Contenus (Variantes/Recettes)</h3>
          <button
            onClick={addContent}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-amber-600 text-white text-sm hover:bg-amber-700 transition-colors hover:cursor-pointer"
          >
            <Plus size={16} />
            Ajouter un contenu
          </button>
        </div>

        {formData.contents.map((content, index) => (
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

        {formData.contents.length === 0 && (
          <p className="text-sm text-gray-500 text-center py-6 bg-[#2a2a2a]/70 border border-neutral-700 rounded-xl">
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
          className={`px-5 py-2.5 rounded-md text-white text-sm font-medium transition-colors hover:cursor-not-allowed ${
            isValid
              ? "bg-amber-600 text-white hover:bg-amber-700"
              : "bg-[#292929] border border-neutral-700 text-gray-300"
          }`}
        >
          Créer la publication
        </button>
      </div>
    </div>
  );
};
