"use client";
import { useState } from "react";
import { usePublicationView } from "@/hooks/view/usePublicationView";
import { PublicationHeaderEditable } from "@/components/view/PublicationHeaderEditable";
import { PublicationDescriptionEditable } from "@/components/view/PublicationDescriptionEditable";
import { PublicationVariantTabs } from "@/components/view/PublicationVariantTabs";
import { PublicationTabs } from "@/components/view/PublicationTabs";
import { DotGrid } from "@/components/ui/DotGrid";
import { SpotlightWrapper } from "@/components/ui/SpotlightWrapper";
import { PublicationHeader } from "@/components/view/PublicationHeader";

import { IngredientBlockEditable } from "@/components/view/IngredientBlockEditable";
import { SegmentBlockEditable } from "@/components/view/SegmentBlockEditable";
import { ContentBlockHeaderEditable } from "@/components/view/ContentBlockHeaderEditable";

import { useIngredientEdit } from "@/hooks/edit/useIngredientEdit";
import { useSegmentEdit } from "@/hooks/edit/useSegmentEdit";
import { useContentEdit } from "@/hooks/edit/useContentEdit";
import { normalizePublication } from "@/utils/normalizePublication";
import type { ServingsPayload } from "@/types/payloadBuilder";

function normalizeServings(val: any): ServingsPayload | null {
  if (!val) return null;
  if (typeof val === "number") {
    return { yield: val, value: "portion(s)" };
  }
  return val as ServingsPayload;
}

export function PublicationView() {
  const {
    publication,
    loading,
    selectedVariant,
    setSelectedVariant,
    checkedItems,
    toggleChecked,
    isAuthenticated,
  } = usePublicationView();

  // normalisation du contenu pour compatibilité des hooks
  const normalized = publication ? normalizePublication(publication) : null;

  // Hooks d'édition toujours appelés
  const ingredientEdit = useIngredientEdit(normalized);
  const segmentEdit = useSegmentEdit(normalized);
  const contentEdit = useContentEdit(normalized);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center text-gray-400">
        Chargement...
      </div>
    );
  }
  if (!publication) return null;

  const [expandedBlocks, setExpandedBlocks] = useState<Record<string, boolean>>({});
  const [tab, setTab] = useState<"ingredients" | "steps">("ingredients");
  const [servingFactors, setServingFactors] = useState<Record<string, number>>({});

  const contents = publication.contents || [];
  const variants = contents.filter((c: any) => !c.is_ingredient);
  const subRecipes = contents.filter((c: any) => c.is_ingredient);
  const activeVariant = variants[selectedVariant] || null;
  const thumbnail = activeVariant?.thumbnail || publication.thumbnail || null;

  const toggleBlock = (id: string) => {
    setExpandedBlocks((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const getBlockId = (block: any) =>
    block.content_id ||
    block.publication_id ||
    block.id ||
    block.subtitle ||
    crypto.randomUUID();

  const isBlockExpanded = (blockId: string, isActiveVariant: boolean) =>
    expandedBlocks[blockId] !== undefined
      ? expandedBlocks[blockId]
      : isActiveVariant;

  const getServingFactor = (blockId: string) => servingFactors[blockId] || 1;
  const setServingFactor = (blockId: string, factor: number) =>
    setServingFactors((prev) => ({ ...prev, [blockId]: factor }));

  // --- rendu principal
  return (
    <DotGrid
      dotSize={10}
      gap={15}
      baseColor="#292929"
      activeColor="#5B4853"
      proximity={120}
      shockRadius={250}
      shockStrength={5}
      resistance={750}
      returnDuration={1.5}
      className="bg-[#1F1F1F] min-h-screen"
    >
      <div className="relative z-20 mx-auto w-full max-w-[1600px] px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        {isAuthenticated ? (
          <PublicationHeaderEditable
            title={publication.title}
            isAuthenticated={isAuthenticated}
            isEditing={ingredientEdit.editingField === "title"}
            editValue={ingredientEdit.editValues["title"] || publication.title}
            onStartEdit={() => ingredientEdit.startEdit("title", publication.title)}
            onCancel={() => ingredientEdit.cancelEdit("title")}
            onConfirm={() =>
              ingredientEdit.confirmIngredient(publication.publication_id, "title", "title")
            }
            onChange={(value) => ingredientEdit.updateValue("title", value)}
          />
        ) : (
          <PublicationHeader title={publication.title} />
        )}

        {/* Thumbnail */}
        <SpotlightWrapper
          className="w-full h-64 rounded-xl mb-6"
          radius="150px"
          spotlightColor="rgba(255,255,255,0.2)"
          softness={1}
        >
          {thumbnail ? (
            <img
              src={thumbnail}
              alt={publication.title}
              className="object-cover w-full h-full transition-transform duration-500 hover:scale-105 rounded-xl"
              loading="lazy"
            />
          ) : (
            <div className="flex items-center justify-center h-full bg-gray-800 text-gray-500 text-sm rounded-xl">
              Aucun visuel
            </div>
          )}
        </SpotlightWrapper>

        {/* Description */}
        <PublicationDescriptionEditable
          description={publication.description || []}
          isAuthenticated={isAuthenticated}
          isEditing={ingredientEdit.editingField === "description"}
          editValue={
            ingredientEdit.editValues["description"] ||
            (publication.description || []).join("\n")
          }
          onStartEdit={() =>
            ingredientEdit.startEdit(
              "description",
              (publication.description || []).join("\n"),
            )
          }
          onCancel={() => ingredientEdit.cancelEdit("description")}
          onConfirm={() =>
            ingredientEdit.confirmIngredient(publication.publication_id, "description", "description")
          }
          onChange={(value) => ingredientEdit.updateValue("description", value)}
        />

        {/* Variantes */}
        <PublicationVariantTabs
          variants={variants}
          selectedVariant={selectedVariant}
          setSelectedVariant={setSelectedVariant}
        />

        {/* Onglets */}
        <PublicationTabs currentTab={tab} setTab={setTab} />

        {/* INGREDIENTS */}
        {tab === "ingredients" && (
          <div className="pb-16">
            {activeVariant && (
              <>
                <ContentBlockHeaderEditable
                  contentId={activeVariant.content_id}
                  subtitle={activeVariant.subtitle}
                  servings={normalizeServings(activeVariant.servings)}
                  isAuthenticated={isAuthenticated}
                  editingField={contentEdit.editingField}
                  editValues={contentEdit.editValues}
                  startEdit={contentEdit.startEdit}
                  cancelEdit={contentEdit.cancelEdit}
                  updateValue={contentEdit.updateValue}
                  confirmContent={contentEdit.confirmContent}
                />
                <IngredientBlockEditable
                  block={activeVariant}
                  expanded={isBlockExpanded(`ing-${getBlockId(activeVariant)}`, true)}
                  toggleBlock={() => toggleBlock(`ing-${getBlockId(activeVariant)}`)}
                  servingFactor={getServingFactor(`ing-${getBlockId(activeVariant)}`)}
                  onServingChange={(factor) =>
                    setServingFactor(`ing-${getBlockId(activeVariant)}`, factor)
                  }
                  ingredients={activeVariant.content_ingredients || []}
                  isAuthenticated={isAuthenticated}
                  checkedItems={checkedItems}
                  toggleChecked={toggleChecked}
                  {...ingredientEdit}
                />
              </>
            )}
            {subRecipes.map((subRecipe) => (
              <IngredientBlockEditable
                key={getBlockId(subRecipe)}
                block={subRecipe}
                expanded={isBlockExpanded(`ing-${getBlockId(subRecipe)}`, false)}
                toggleBlock={() => toggleBlock(`ing-${getBlockId(subRecipe)}`)}
                servingFactor={getServingFactor(`ing-${getBlockId(subRecipe)}`)}
                onServingChange={(factor) =>
                  setServingFactor(`ing-${getBlockId(subRecipe)}`, factor)
                }
                ingredients={subRecipe.content_ingredients || []}
                isAuthenticated={isAuthenticated}
                checkedItems={checkedItems}
                toggleChecked={toggleChecked}
                {...ingredientEdit}
              />
            ))}
          </div>
        )}

        {/* ÉTAPES */}
        {tab === "steps" && (
          <div className="pb-16">
            {activeVariant && (
              <SegmentBlockEditable
                block={activeVariant}
                expanded={isBlockExpanded(`step-${getBlockId(activeVariant)}`, true)}
                toggleBlock={() => toggleBlock(`step-${getBlockId(activeVariant)}`)}
                segments={activeVariant.content_segments || []}
                isAuthenticated={isAuthenticated}
                checkedItems={checkedItems}
                toggleChecked={toggleChecked}
                {...segmentEdit}
              />
            )}
            {subRecipes.map((subRecipe) => (
              <SegmentBlockEditable
                key={getBlockId(subRecipe)}
                block={subRecipe}
                expanded={isBlockExpanded(`step-${getBlockId(subRecipe)}`, false)}
                toggleBlock={() => toggleBlock(`step-${getBlockId(subRecipe)}`)}
                segments={subRecipe.content_segments || []}
                isAuthenticated={isAuthenticated}
                checkedItems={checkedItems}
                toggleChecked={toggleChecked}
                {...segmentEdit}
              />
            ))}
          </div>
        )}
      </div>
    </DotGrid>
  );
}
