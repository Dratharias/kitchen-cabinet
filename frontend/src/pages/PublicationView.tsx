import { useState, useMemo, useCallback, useEffect } from "react";
import { usePublicationView } from "../hooks/view/usePublicationView";
import { PublicationHeader } from "../components/view/PublicationHeader";
import { PublicationVariantTabs } from "../components/view/PublicationVariantTabs";
import { PublicationTabs } from "../components/view/PublicationTabs";
import { DotGrid } from "../components/ui/DotGrid";
import { Gallery } from "../components/ui/Gallery";
import { IngredientBlockEditable } from "../components/view/IngredientBlockEditable";
import { SegmentBlockEditable } from "../components/view/SegmentBlockEditable";
import { PublicationActions } from "../components/view/PublicationActions";
import { PublicationInfoView } from "../components/view/PublicationInfoView";
import { PublicationMetadataView } from "../components/view/PublicationMetadataView";
import { PublicationForm } from "../components/organisms/PublicationForm";
import {
  normalizePublicationToForm,
  denormalizeFormToPublication,
} from "../utils/formTransformers";
import type { PublicationPayload, GalleryItem, Publication } from "../types";
import { Clock, Users } from "lucide-react";

const getBlockId = (block: any) =>
  block.content_id ||
  block.publication_id ||
  block.id ||
  block.subtitle ||
  crypto.randomUUID();

// --- Composant Principal ---
export function PublicationView() {
  const {
    publication,
    loading,
    selectedVariant,
    setSelectedVariant,
    checkedItems,
    toggleChecked,
    isAuthenticated,
    updatePublication,
  } = usePublicationView();

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<PublicationPayload> | null>(
    null,
  );
  const [showMetadata, setShowMetadata] = useState(false);
  const [expandedBlocks, setExpandedBlocks] = useState<Record<string, boolean>>(
    {},
  );
  const [tab, setTab] = useState<"ingredients" | "steps">("ingredients");

  useEffect(() => {
    if (publication && isEditing) {
      setFormData(normalizePublicationToForm(publication as Publication));
    } else {
      setFormData(null);
    }
  }, [publication, isEditing]);

  const handleEdit = () => setIsEditing(true);
  const handleCancel = () => setIsEditing(false);

  const handleSave = async () => {
    if (formData && publication) {
      const payload = denormalizeFormToPublication(
        formData,
        publication as Publication,
      );
      const success = await updatePublication(payload);
      if (success) {
        setIsEditing(false);
      }
    }
  };

  const contents = publication?.contents || [];

  const { variants, subRecipes } = useMemo(() => {
    const normalizedContents = contents.map((c: any) => ({
      ...c,
      servings: c.servings,
    }));
    return {
      variants: normalizedContents.filter((c: any) => !c.is_ingredient),
      subRecipes: normalizedContents.filter((c: any) => c.is_ingredient),
    };
  }, [contents]);

  const activeVariant = variants[selectedVariant] || null;

  const allGalleryItems = useMemo(() => {
    const items: GalleryItem[] = [];
    const pub = publication as Publication & { gallery?: GalleryItem[] };

    if (pub?.gallery && Array.isArray(pub.gallery)) {
      items.push(...pub.gallery);
    }
    if (activeVariant?.gallery) {
      items.push(...activeVariant.gallery);
    }
    // Deduplicate items by gallery_id
    const uniqueItems = Array.from(
      new Map(items.map((item) => [item.gallery_id, item])).values(),
    );
    return uniqueItems.sort((a, b) => (a.order_num || 0) - (b.order_num || 0));
  }, [publication, activeVariant]);

  const allDisplayBlocks = useMemo(() => {
    const blocks: any[] = [];
    if (activeVariant) {
      blocks.push({ ...activeVariant, __isMainVariant: true });
    }
    blocks.push(
      ...subRecipes.map((c: any) => ({ ...c, __isMainVariant: false })),
    );
    return blocks;
  }, [activeVariant, subRecipes]);

  const toggleBlock = useCallback((id: string) => {
    setExpandedBlocks((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const isBlockExpanded = useCallback(
    (blockId: string, isMainVariant: boolean) =>
      expandedBlocks[blockId] !== undefined
        ? expandedBlocks[blockId]
        : isMainVariant,
    [expandedBlocks],
  );

  const dotGridProps = {
    dotSize: 10,
    gap: 15,
    baseColor: "#292929",
    activeColor: "#5B4853",
    proximity: 120,
    shockRadius: 250,
    shockStrength: 5,
    resistance: 750,
    returnDuration: 1.5,
    className: "bg-[#1F1F1F] min-h-screen",
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center text-gray-400">
        Chargement...
      </div>
    );
  }
  if (!publication) return null;

  // --- Render ---

  if (isEditing && formData) {
    return (
      <DotGrid {...dotGridProps}>
        <div className="relative z-20 mx-auto w-full max-w-[1600px] px-4 sm:px-6 lg:px-8 py-6">
          <PublicationHeader title={`Modification de: ${publication.title}`} />
          <PublicationForm
            initialData={formData}
            onSubmit={handleSave}
            onCancel={handleCancel}
          />
        </div>
      </DotGrid>
    );
  }

  return (
    <>
      <DotGrid {...dotGridProps}>
        <div className="relative z-20 mx-auto w-full max-w-[1600px] px-4 sm:px-6 lg:px-8 py-6">
          <PublicationHeader title={publication.title} />

          <div className="w-full h-64 rounded-xl mb-6 bg-gray-800/20">
            {allGalleryItems && allGalleryItems.length > 0 ? (
              <Gallery items={allGalleryItems} />
            ) : (
              <div className="flex items-center justify-center h-full bg-gray-800 text-gray-500 text-sm rounded-xl">
                Aucun visuel
              </div>
            )}
          </div>

          <PublicationInfoView
            description={publication.description || []}
            notes={publication.note || []}
          />

          {activeVariant && (
            <div className="flex items-center justify-between p-2 bg-[#1F1F1F]/0 border-b border-t border-gray-700 my-4">
              <div className="flex items-center gap-2 text-gray-300">
                <Clock className="w-4 h-4 text-amber-400" />
                <span className="text-sm">
                  {activeVariant.total_prep_time} min
                </span>
              </div>
              {activeVariant.servings && (
                <div className="flex items-center gap-3">
                  <Users className="w-4 h-4 text-amber-400" />
                  <span className="text-white font-semibold min-w-[80px] text-center">
                    {activeVariant.servings.yield}{" "}
                    {activeVariant.servings.value}
                  </span>
                </div>
              )}
            </div>
          )}

          <PublicationVariantTabs
            variants={variants}
            selectedVariant={selectedVariant}
            setSelectedVariant={setSelectedVariant}
          />

          {showMetadata && (
            <PublicationMetadataView publication={publication} />
          )}

          <PublicationTabs currentTab={tab} setTab={setTab} />

          {tab === "ingredients" && (
            <div className="pb-16 space-y-4">
              {allDisplayBlocks.map((block) => {
                const blockId = getBlockId(block);
                return (
                  <IngredientBlockEditable
                    key={`ing-${blockId}`}
                    block={block}
                    expanded={isBlockExpanded(
                      `ing-${blockId}`,
                      block.__isMainVariant,
                    )}
                    toggleBlock={() => toggleBlock(`ing-${blockId}`)}
                    ingredients={block.content_ingredients || []}
                    isAuthenticated={isAuthenticated}
                    checkedItems={checkedItems}
                    toggleChecked={toggleChecked}
                    onConfirmUpdate={() => Promise.resolve(false)}
                    onDeleteIngredient={() => Promise.resolve(false)}
                    pendingAddItem={false}
                    onConfirmAdd={() => {}}
                    onCancelAdd={() => {}}
                    onAddIngredientClick={() => {}}
                  />
                );
              })}
            </div>
          )}
          {tab === "steps" && (
            <div className="pb-16 space-y-4">
              {allDisplayBlocks.map((block) => {
                const blockId = getBlockId(block);
                return (
                  <SegmentBlockEditable
                    key={`step-${blockId}`}
                    block={block}
                    expanded={isBlockExpanded(
                      `step-${blockId}`,
                      block.__isMainVariant,
                    )}
                    toggleBlock={() => toggleBlock(`step-${blockId}`)}
                    segments={block.content_segments || []}
                    isAuthenticated={isAuthenticated}
                    checkedItems={checkedItems}
                    toggleChecked={toggleChecked}
                    onConfirmUpdate={() => Promise.resolve(false)}
                    onDeleteSegment={() => Promise.resolve(false)}
                    pendingAddItem={false}
                    onConfirmAdd={() => {}}
                    onCancelAdd={() => {}}
                    onAddSegmentClick={function (): void {
                      throw new Error("Function not implemented.");
                    }}
                  />
                );
              })}
            </div>
          )}
        </div>
      </DotGrid>

      <PublicationActions
        isEditMode={isEditing}
        isAuthenticated={isAuthenticated}
        onEdit={handleEdit}
        onSave={handleSave}
        onCancel={handleCancel}
        onToggleMetadata={() => setShowMetadata((prev) => !prev)}
        showMetadata={showMetadata}
      />
    </>
  );
}

