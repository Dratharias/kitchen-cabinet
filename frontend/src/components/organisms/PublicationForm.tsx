import React, { useState, useEffect } from "react";
import { PublicationFormSection } from "../molecules/PublicationFormSection";
import { ContentFormSection } from "../molecules/ContentFormSection";
import { AITab } from "../molecules/AITab";
import { Plus, Trash2, ChevronDown, ChevronRight, Edit3, Bot } from "lucide-react";
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
  const [activeTab, setActiveTab] = useState<'manual' | 'ai'>('manual');

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
          subtitle: "",
          note: "",
          total_prep_time: 0,
          prep_time_note: "",
          serving_yield: 1,
          serving_value: "portion",
          gallery: [],
          ingredients: [],
          segments: [],
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
    // Send data directly to orchestrator
    onSubmit(formData);
  };

  const handleAIMigration = (payload: any) => {
    // Extract publication data from wrapped payload (orchestrator format)
    // Payload can be either { "recipe-key": {...} } or direct {...}
    let publicationData = payload;

    // If payload is wrapped (has keys that are not publication fields), unwrap it
    if (payload && typeof payload === 'object' && !payload.title) {
      const keys = Object.keys(payload);
      if (keys.length > 0) {
        // Take the first key's value as the publication data
        publicationData = payload[keys[0]];
      }
    }

    // Transform segments from nested to flat format for the form
    // Backend format: { position: 1, segment: { title, paragraph, note } }
    // Frontend format: { position: 1, title, paragraph, note }
    if (publicationData.contents) {
      publicationData.contents = publicationData.contents.map((content: any) => {
        if (content.segments) {
          content.segments = content.segments.map((seg: any) => {
            // If segment is nested, flatten it
            if (seg.segment) {
              return {
                position: seg.position,
                ...seg.segment,
              };
            }
            return seg;
          });
        }
        return content;
      });
    }

    // Update form data with AI-migrated payload
    setFormData(publicationData);
    // Switch to manual tab to show the migrated data
    setActiveTab('manual');
    // Expand first content if exists
    if (publicationData.contents && publicationData.contents.length > 0) {
      setExpandedContents({ 0: true });
    }
  };

  const isValidForm = (): boolean => {
    if (!formData.title?.trim()) return false;

    if (!formData.contents || formData.contents.length === 0) return false;

    for (const content of formData.contents) {
      if (!content.ingredients || content.ingredients.length === 0)
        return false;
      for (const ing of content.ingredients) {
        if (!ing.product?.name?.trim()) return false;
      }
      if (!content.segments || content.segments.length === 0) return false;
      for (const seg of content.segments) {
        if (!seg.paragraph?.trim()) return false;
      }
    }
    return true;
  };

  const canSubmit = isValidForm();

  return (
    <div className="space-y-8">
      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-neutral-700">
        <button
          onClick={() => setActiveTab('manual')}
          className={`flex items-center gap-2 px-4 py-3 font-medium transition-all ${
            activeTab === 'manual'
              ? 'text-amber-400 border-b-2 border-amber-400'
              : 'text-gray-400 hover:text-gray-300'
          }`}
        >
          <Edit3 size={18} />
          Édition Manuelle
        </button>
        <button
          onClick={() => setActiveTab('ai')}
          className={`flex items-center gap-2 px-4 py-3 font-medium transition-all ${
            activeTab === 'ai'
              ? 'text-purple-400 border-b-2 border-purple-400'
              : 'text-gray-400 hover:text-gray-300'
          }`}
        >
          <Bot size={18} />
          Migration AI
        </button>
      </div>

      {activeTab === 'ai' ? (
        /* AI Tab */
        <div className="bg-[#2a2a2a]/70 border border-neutral-700 rounded-xl p-6">
          <AITab onMigrationComplete={handleAIMigration} />
        </div>
      ) : (
        /* Manual Tab */
        <>
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
        </>
      )}
    </div>
  );
};
