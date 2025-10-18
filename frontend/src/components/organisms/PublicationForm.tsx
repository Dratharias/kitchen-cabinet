import React, { useState, useEffect } from "react";
import { PublicationFormSection } from "../molecules/PublicationFormSection";
import { ContentFormSection } from "../molecules/ContentFormSection";
import { Plus, Trash2, ChevronDown, ChevronRight } from "lucide-react";
import { ContentPayload, Publication } from "../../types";
import { AnimatePresence, motion } from "framer-motion";

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
        ? Array.isArray(initialData.description)
          ? initialData.description
          : [initialData.description]
        : [];

    const noteAsArray: string[] =
      initialData.note && initialData.note.length > 0
        ? Array.isArray(initialData.note)
          ? initialData.note
          : [initialData.note]
        : [];

    return {
      ...baseState,
      ...initialData,
      description: descriptionAsArray,
      note: noteAsArray,
    };
  };

  const [formData, setFormData] = useState(getInitialState);
  const [expandedContents, setExpandedContents] = useState<
    Record<number, boolean>
  >({});

  useEffect(() => {
    const initialState = getInitialState();
    setFormData(initialState as any);
    if (initialState.contents && initialState.contents.length > 0) {
      setExpandedContents({ 0: true });
    }
  }, [initialData]);

  const toggleContent = (index: number) => {
    setExpandedContents((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  const handlePublicationChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const addContent = () => {
    const newIndex = formData.contents?.length || 0;
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
    setExpandedContents((prev) => ({ ...prev, [newIndex]: true }));
  };

  const removeContent = (index: number) => {
    setFormData((prev: any) => ({
      ...prev,
      contents: (prev.contents || []).filter(
        (_: any, i: number) => i !== index,
      ),
    }));
  };

  const updateContent = (index: number, content: Partial<ContentPayload>) => {
    setFormData((prev: any) => ({
      ...prev,
      contents: (prev.contents || []).map((c: any, i: number) =>
        i === index ? content : c,
      ),
    }));
  };

  const handleSubmit = () => {
    // On ne construit plus le payload ici.
    // On envoie directement les données du formulaire.
    onSubmit(formData);
  };

  const isValidForm = (): boolean => {
    if (!formData.title?.trim()) return false;

    if (!formData.contents || formData.contents.length === 0) return false;

    for (const content of formData.contents) {
      if (
        !content.content_ingredients ||
        content.content_ingredients.length === 0
      )
        return false;
      for (const ing of content.content_ingredients) {
        if (!ing.product?.name?.trim()) return false;
      }
      if (!content.content_segments || content.content_segments.length === 0)
        return false;
      for (const seg of content.content_segments) {
        const paragraph = seg.paragraph || seg.segment?.paragraph;
        if (!paragraph?.trim()) return false;
      }
    }
    return true;
  };

  const canSubmit = isValidForm();

  return (
    <div className="space-y-8">
      <div className="bg-[#2a2a2a]/70 border border-neutral-700 rounded-xl p-6">
        <PublicationFormSection
          title={formData.title || ""}
          description={formData.description || []}
          note={formData.note || []}
          isPublic={formData.public ?? true}
          isPublished={formData.published ?? true}
          thumbnail={formData.thumbnail || ""}
          onChange={handlePublicationChange}
        />
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center px-2">
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
            className="bg-[#2a2a2a]/70 border border-neutral-700 rounded-xl"
          >
            <header
              className="flex items-center justify-between p-4 cursor-pointer"
              onClick={() => toggleContent(index)}
            >
              <div className="flex items-center gap-2">
                {expandedContents[index] ? (
                  <ChevronDown size={20} />
                ) : (
                  <ChevronRight size={20} />
                )}
                <h4 className="text-md font-semibold text-amber-500">
                  {content.subtitle || `Contenu #${index + 1}`}
                </h4>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeContent(index);
                }}
                className="p-2 text-red-400 hover:text-red-300 transition-colors"
              >
                <Trash2 size={18} />
              </button>
            </header>
            <AnimatePresence>
              {expandedContents[index] && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="overflow-hidden"
                >
                  <div className="p-6 border-t border-neutral-700">
                    <ContentFormSection
                      content={content}
                      onChange={(updated) => updateContent(index, updated)}
                      index={index}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}

        {(!formData.contents || formData.contents.length === 0) && (
          <p className="text-sm text-gray-500 text-center py-6 bg-[#2a2a2a]/70 border border-neutral-700 rounded-xl">
            Aucun contenu. Cliquez sur "Ajouter un contenu" pour commencer.
          </p>
        )}
      </div>

      <div className="flex gap-3 justify-end mt-8">
        {onCancel && (
          <button
            onClick={onCancel}
            className="px-5 py-2.5 rounded-md border border-neutral-700 text-gray-300 text-sm font-medium hover:bg-[#333333] transition-colors"
          >
            Annuler
          </button>
        )}
        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className={`px-5 py-2.5 rounded-md text-sm font-medium transition-colors ${
            canSubmit
              ? "bg-amber-600 text-white hover:bg-amber-700"
              : "bg-neutral-700 text-gray-400 cursor-not-allowed"
          }`}
        >
          {initialData?.publication_id
            ? "Sauvegarder les modifications"
            : "Créer la publication"}
        </button>
      </div>
    </div>
  );
};
