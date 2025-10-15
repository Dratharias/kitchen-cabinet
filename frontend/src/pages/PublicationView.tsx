"use client";
import { useState, useMemo, useCallback } from "react";
import { usePublicationView } from "@/hooks/view/usePublicationView";
import { PublicationHeaderEditable } from "@/components/view/PublicationHeaderEditable";
import { PublicationDescriptionEditable } from "@/components/view/PublicationDescriptionEditable";
import { PublicationVariantTabs } from "@/components/view/PublicationVariantTabs";
import { PublicationTabs } from "@/components/view/PublicationTabs";
import { DotGrid } from "@/components/ui/DotGrid";
import { SpotlightWrapper } from "@/components/ui/SpotlightWrapper";
import { IngredientBlockEditable } from "@/components/view/IngredientBlockEditable";
import { ContentBlockHeaderEditable } from "@/components/view/ContentBlockHeaderEditable";
import { SegmentBlockEditable } from "@/components/view/SegmentBlockEditable";
import type { ServingsPayload } from "@/types/payloadBuilder";

// --- Helpers ---

function normalizeServings(val: any): ServingsPayload | null {
  if (!val) return null;
  if (typeof val === "object" && val.yield !== undefined) {
    return val as ServingsPayload;
  }
  if (typeof val === "number") {
    return { yield: val, value: "portion(s)" };
  }
  return null;
}

const getBlockId = (block: any) =>
  block.content_id ||
  block.publication_id ||
  block.id ||
  block.subtitle ||
  crypto.randomUUID();

const parseServingsLabel = (label: string): ServingsPayload => {
  const match = label.match(/(\d+)\s*(.*)/) || [];
  const yieldValue = parseInt(match[1], 10) || 1;
  let unitValue = match[2].trim();

  if (!unitValue || unitValue.toLowerCase().startsWith("portion")) {
    unitValue = yieldValue > 1 ? "portions" : "portion";
  }

  return { yield: yieldValue, value: unitValue };
};

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
    updatePublicationField,
    updateContentField,
    updateIngredientFields,
    updateSegmentFields,
    addIngredient,
    deleteIngredient,
    addSegment,
    deleteSegment,
  } = usePublicationView();

  const [expandedBlocks, setExpandedBlocks] = useState<Record<string, boolean>>(
    {},
  );
  const [tab, setTab] = useState<"ingredients" | "steps">("ingredients");
  const [servingFactors, setServingFactors] = useState<Record<string, number>>(
    {},
  );
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Record<string, string>>({});

  const contents = publication?.contents || [];

  const { variants, subRecipes } = useMemo(() => {
    const normalizedContents = contents.map((c) => ({
      ...c,
      servings: normalizeServings(c.servings),
    }));
    return {
      variants: normalizedContents.filter((c: any) => !c.is_ingredient),
      subRecipes: normalizedContents.filter((c: any) => c.is_ingredient),
    };
  }, [contents]);

  const activeVariant = variants[selectedVariant] || null;
  const thumbnail =
    activeVariant?.gallery?.[0] || publication?.thumbnail || null;

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

  const getServingFactor = useCallback(
    (blockId: string) => servingFactors[blockId] || 1,
    [servingFactors],
  );
  const setServingFactor = useCallback(
    (blockId: string, factor: number) =>
      setServingFactors((prev) => ({ ...prev, [blockId]: factor })),
    [setServingFactors],
  );

  const startEdit = useCallback((fieldId: string, value: string) => {
    setEditingField(fieldId);
    setEditValues({ [fieldId]: value });
  }, []);

  const cancelEdit = useCallback(() => {
    setEditingField(null);
    setEditValues({});
  }, []);

  const updateValue = useCallback((fieldId: string, value: string) => {
    setEditValues({ [fieldId]: value });
  }, []);

  const confirmEdit = useCallback(
    async (
      fieldId: string,
      resourceId: string,
      resourceType: "publication" | "content",
      fieldName: string,
    ) => {
      const value = editValues[fieldId];
      if (value === undefined) {
        cancelEdit();
        return;
      }

      let success = false;
      let fields: any = { [fieldName]: value };

      switch (resourceType) {
        case "publication":
          success = await updatePublicationField(fields);
          break;
        case "content":
          if (fieldName === "servings") {
            fields = { servings: parseServingsLabel(value) };
          }
          success = await updateContentField(resourceId, fields);
          break;
      }

      if (success) {
        cancelEdit();
      }
    },
    [editValues, cancelEdit, updatePublicationField, updateContentField],
  );

  const renderIngredientBlocks = () => (
    <div className="pb-16 space-y-4">
      {allDisplayBlocks.map((block) => {
        const blockId = getBlockId(block);
        const isMainVariant = block.__isMainVariant;

        return (
          <div key={`ing-${blockId}`}>
            {isMainVariant && (
              <ContentBlockHeaderEditable
                contentId={block.content_id}
                subtitle={block.subtitle}
                servings={block.servings}
                isAuthenticated={isAuthenticated}
                editingField={editingField}
                editValues={editValues}
                startEdit={startEdit}
                cancelEdit={cancelEdit}
                updateValue={updateValue}
                confirmContent={(field) =>
                  confirmEdit(
                    `${field}-${block.content_id}`,
                    block.content_id,
                    "content",
                    field,
                  )
                }
              />
            )}

            <IngredientBlockEditable
              block={block}
              expanded={isBlockExpanded(`ing-${blockId}`, isMainVariant)}
              toggleBlock={() => toggleBlock(`ing-${blockId}`)}
              ingredients={block.content_ingredients || []}
              isAuthenticated={isAuthenticated}
              checkedItems={checkedItems}
              toggleChecked={toggleChecked}
              onConfirmUpdate={updateIngredientFields}
              onAddIngredient={addIngredient}
              onDeleteIngredient={deleteIngredient}
            />
          </div>
        );
      })}
    </div>
  );

  const renderSegmentBlocks = () => (
    <div className="pb-16 space-y-4">
      {allDisplayBlocks.map((block) => {
        const blockId = getBlockId(block);
        const isMainVariant = block.__isMainVariant;

        if (!block.content_segments || block.content_segments.length === 0)
          return null;

        return (
          <SegmentBlockEditable
            key={`step-${blockId}`}
            block={block}
            expanded={isBlockExpanded(`step-${blockId}`, isMainVariant)}
            toggleBlock={() => toggleBlock(`step-${blockId}`)}
            segments={block.content_segments || []}
            isAuthenticated={isAuthenticated}
            checkedItems={checkedItems}
            toggleChecked={toggleChecked}
            onConfirmUpdate={updateSegmentFields}
            onAddSegment={addSegment}
            onDeleteSegment={deleteSegment}
          />
        );
      })}
    </div>
  );

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center text-gray-400">
        Chargement...
      </div>
    );
  }
  if (!publication) return null;

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
        <PublicationHeaderEditable
          title={publication.title}
          isAuthenticated={isAuthenticated}
          isEditing={editingField === "title"}
          editValue={editValues["title"] || publication.title}
          onStartEdit={() => startEdit("title", publication.title)}
          onCancel={cancelEdit}
          onConfirm={() =>
            confirmEdit(
              "title",
              publication.publication_id,
              "publication",
              "title",
            )
          }
          onChange={(value) => updateValue("title", value)}
        />

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

        <PublicationDescriptionEditable
          description={publication.description || []}
          isAuthenticated={isAuthenticated}
          isEditing={editingField === "description"}
          editValue={
            editValues["description"] ||
            (publication.description || []).join("\n")
          }
          onStartEdit={() =>
            startEdit("description", (publication.description || []).join("\n"))
          }
          onCancel={cancelEdit}
          onConfirm={() =>
            confirmEdit(
              "description",
              publication.publication_id,
              "publication",
              "description",
            )
          }
          onChange={(value) => updateValue("description", value)}
        />

        <PublicationVariantTabs
          variants={variants}
          selectedVariant={selectedVariant}
          setSelectedVariant={setSelectedVariant}
        />

        <PublicationTabs currentTab={tab} setTab={setTab} />

        {tab === "ingredients" && renderIngredientBlocks()}
        {tab === "steps" && renderSegmentBlocks()}
      </div>
    </DotGrid>
  );
}
