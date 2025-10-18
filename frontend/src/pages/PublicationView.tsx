import { useState, useMemo, useCallback, useEffect } from "react";
import { usePublicationView } from "../hooks/view/usePublicationView";
import { usePublicationEdit } from "../hooks/view/usePublicationEdit";
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
import { normalizePublicationToForm } from "../utils/formTransformers";
import type { PublicationPayload, GalleryItem, Content } from "../types";
import { Clock, Users } from "lucide-react";
import { formatTime, TIME_FORMATS } from "@/utils/timeFormatter";
import { AnimatePresence, motion } from "framer-motion";

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
    updatePublication,
    updateIngredientFields,
    deleteIngredient,
    addIngredient,
    updateSegmentFields,
    deleteSegment,
    addSegment,
    setLocalPublication,
  } = usePublicationView();

  const { setEditingField, isAuthenticated } = usePublicationEdit();

  const [isEditing, setIsEditing] = useState(false);
  const [showMetadata, setShowMetadata] = useState(false);
  const [expandedBlocks, setExpandedBlocks] = useState<Record<string, boolean>>(
    {},
  );
  const [tab, setTab] = useState<"ingredients" | "steps">("ingredients");
  const [pendingAddItem, setPendingAddItem] = useState<{
    type: "ingredient" | "segment";
    blockId: string;
  } | null>(null);

  const handleEdit = () => setIsEditing(true);
  const handleCancel = () => setIsEditing(false);

  const handleSave = async (payload: PublicationPayload) => {
    const success = await updatePublication(payload);
    if (success) {
      setIsEditing(false);
    }
  };

  const handleConfirmIngredientUpdate = async (
    ingredientId: string,
    fields: any,
  ) => {
    const updatedIngredient = await updateIngredientFields(
      ingredientId,
      fields,
    );
    if (updatedIngredient) {
      setLocalPublication((prevPub) => {
        if (!prevPub) return null;
        const newPub = JSON.parse(JSON.stringify(prevPub));
        for (const content of newPub.contents) {
          const index = content.content_ingredients.findIndex(
            (i: any) => i.ingredient_id === ingredientId,
          );
          if (index > -1) {
            content.content_ingredients[index] = {
              ...content.content_ingredients[index],
              ...updatedIngredient,
            };
          }
        }
        return newPub;
      });
      setEditingField(null);
    }
  };

  const handleConfirmSegmentUpdate = async (segmentId: string, fields: any) => {
    const updatedSegment = await updateSegmentFields(segmentId, fields);
    if (updatedSegment) {
      setLocalPublication((prevPub) => {
        if (!prevPub) return null;
        const newPub = JSON.parse(JSON.stringify(prevPub));
        for (const content of newPub.contents) {
          const index = content.content_segments.findIndex(
            (s: any) => s.segment.segment_id === segmentId,
          );
          if (index > -1) {
            content.content_segments[index].segment = {
              ...content.content_segments[index].segment,
              ...updatedSegment,
            };
          }
        }
        return newPub;
      });
      setEditingField(null);
    }
  };

  const handleConfirmAdd = async (blockId: string, fields: any) => {
    if (!pendingAddItem) return;
    const contentId = blockId.replace("ing-", "").replace("step-", "");

    if (pendingAddItem.type === "ingredient") {
      await addIngredient(contentId, fields);
    } else {
      await addSegment(contentId, fields);
    }
    setPendingAddItem(null);
  };

  const handleDeleteIngredient = async (ingredientId: string) => {
    const success = await deleteIngredient(ingredientId);
    if (success) {
      setLocalPublication((prevPub) => {
        if (!prevPub) return null;
        const newPub = JSON.parse(JSON.stringify(prevPub));
        newPub.contents.forEach((content: Content) => {
          if (content.content_ingredients) {
            content.content_ingredients = content.content_ingredients.filter(
              (i: any) => i.ingredient_id !== ingredientId,
            );
          }
        });
        return newPub;
      });
    }
  };

  const handleDeleteSegment = async (segmentId: string) => {
    const success = await deleteSegment(segmentId);
    if (success) {
      setLocalPublication((prevPub) => {
        if (!prevPub) return null;
        const newPub = JSON.parse(JSON.stringify(prevPub));
        newPub.contents.forEach((content: Content) => {
          if (content.content_segments) {
            content.content_segments = content.content_segments.filter(
              (s: any) => s.segment_id !== segmentId,
            );
          }
        });
        return newPub;
      });
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
    if (!activeVariant?.gallery) return [];
    const items: GalleryItem[] = Array.isArray(activeVariant.gallery)
      ? activeVariant.gallery
      : [activeVariant.gallery];
    const uniqueItems = Array.from(
      new Map(items.map((item) => [item.gallery_id, item])).values(),
    );
    return uniqueItems.sort((a, b) => (a.order_num || 0) - (b.order_num || 0));
  }, [activeVariant]);

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

  useEffect(() => {
    if (allDisplayBlocks.length > 0) {
      const initialExpanded: Record<string, boolean> = {};
      const firstBlock = allDisplayBlocks.find((b) => b.__isMainVariant);
      if (firstBlock) {
        const ingBlockId = `ing-${getBlockId(firstBlock)}`;
        const stepBlockId = `step-${getBlockId(firstBlock)}`;
        initialExpanded[ingBlockId] = true;
        initialExpanded[stepBlockId] = true;
      }
      setExpandedBlocks(initialExpanded);
    }
  }, [publication, selectedVariant]); // Re-run when publication or variant changes

  const toggleBlock = useCallback((id: string) => {
    setExpandedBlocks((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const isBlockExpanded = useCallback(
    (blockId: string) => !!expandedBlocks[blockId],
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
    className: "bg-[#1F1F1F] min-h-screen py-8",
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

  if (isEditing) {
    const formInitialData = normalizePublicationToForm(publication);
    return (
      <DotGrid {...dotGridProps}>
        <div className="relative z-20 mx-auto w-full max-w-[1600px] px-4 sm:px-6 lg:px-8 py-6">
          <PublicationHeader title={`Modification de: ${publication.title}`} />
          <PublicationForm
            initialData={formInitialData}
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

          {publication.thumbnail ? (
            <div className="relative w-full h-48 mb-6 overflow-hidden rounded-md">
              <img
                src={publication.thumbnail}
                alt={publication.title}
                className="object-cover w-full h-full transition-transform duration-500 hover:scale-105 flex bg-gray-800 text-gray-500 text-sm rounded-md"
                loading="lazy"
              />
            </div>
          ) : (
            <div className="flex h-48 bg-gray-800 text-gray-500 text-sm rounded-md">
              Aucun visuel
            </div>
          )}

          <PublicationInfoView
            description={publication.description || []}
            notes={publication.note || []}
          />

          {activeVariant && (
            <div className="flex items-center justify-between p-2 bg-[#1F1F1F]/0 border-b border-t border-gray-700 my-4">
              <div className="flex items-center gap-2 text-gray-300">
                <Clock className="w-4 h-4 text-amber-400" />
                <span className="text-sm">
                  {formatTime(TIME_FORMATS.auto, activeVariant.total_prep_time)}
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

          <AnimatePresence>
            {showMetadata && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                <PublicationMetadataView publication={publication} />
              </motion.div>
            )}
          </AnimatePresence>

          <PublicationTabs currentTab={tab} setTab={setTab} />

          {tab === "ingredients" && (
            <div className="pb-16 space-y-4">
              {allDisplayBlocks.map((block) => {
                const blockId = `ing-${getBlockId(block)}`;
                return (
                  <IngredientBlockEditable
                    key={blockId}
                    block={block}
                    expanded={isBlockExpanded(blockId)}
                    toggleBlock={() => toggleBlock(blockId)}
                    ingredients={block.content_ingredients || []}
                    isAuthenticated={isAuthenticated}
                    checkedItems={checkedItems}
                    toggleChecked={toggleChecked}
                    onConfirmUpdate={handleConfirmIngredientUpdate}
                    onDeleteIngredient={handleDeleteIngredient}
                    pendingAddItem={
                      pendingAddItem?.type === "ingredient" &&
                      pendingAddItem?.blockId === blockId
                    }
                    onConfirmAdd={(fields) => handleConfirmAdd(blockId, fields)}
                    onCancelAdd={() => setPendingAddItem(null)}
                    onAddIngredientClick={() =>
                      setPendingAddItem({ type: "ingredient", blockId })
                    }
                  />
                );
              })}
            </div>
          )}
          {tab === "steps" && (
            <div className="pb-16 space-y-4">
              {allDisplayBlocks.map((block) => {
                const blockId = `step-${getBlockId(block)}`;
                return (
                  <SegmentBlockEditable
                    key={blockId}
                    block={block}
                    expanded={isBlockExpanded(blockId)}
                    toggleBlock={() => toggleBlock(blockId)}
                    segments={block.content_segments || []}
                    isAuthenticated={isAuthenticated}
                    checkedItems={checkedItems}
                    toggleChecked={toggleChecked}
                    onConfirmUpdate={handleConfirmSegmentUpdate}
                    onDeleteSegment={handleDeleteSegment}
                    pendingAddItem={
                      pendingAddItem?.type === "segment" &&
                      pendingAddItem?.blockId === blockId
                    }
                    onConfirmAdd={(fields) => handleConfirmAdd(blockId, fields)}
                    onCancelAdd={() => setPendingAddItem(null)}
                    onAddSegmentClick={() =>
                      setPendingAddItem({ type: "segment", blockId })
                    }
                  />
                );
              })}
            </div>
          )}
          <div className="w-full h-64 rounded-xl mb-6 bg-gray-800/20">
            {allGalleryItems && allGalleryItems.length > 0 && (
              <Gallery items={allGalleryItems} />
            )}
          </div>
        </div>
      </DotGrid>

      <PublicationActions
        isEditMode={isEditing}
        isAuthenticated={isAuthenticated}
        onEdit={handleEdit}
        onSave={() => {
          // This button is now more of a conceptual trigger
          // The actual save is handled by the form's submit button
          // This can be left as is, or the logic can be moved entirely
          // to be managed by the form. For now, it does nothing.
        }}
        onCancel={handleCancel}
        onToggleMetadata={() => setShowMetadata((prev) => !prev)}
        showMetadata={showMetadata}
      />
    </>
  );
}
