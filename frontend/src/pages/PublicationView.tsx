"use client";
import { useState, useMemo, useCallback } from "react";
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
import type { ServingsPayload } from "@/types/payloadBuilder";
import { FileText, Utensils } from "lucide-react";

// --- Helpers ---

/** Helper to ensure servings data is in the expected object format for display */
function normalizeServings(val: any): ServingsPayload | null {
  if (!val) return null;
  if (typeof val === "number") {
    return { yield: val, value: "portion(s)" };
  }
  return val as ServingsPayload;
}

/** Helper to get a stable ID for block keying */
const getBlockId = (block: any) =>
  block.content_id ||
  block.publication_id ||
  block.id ||
  block.subtitle ||
  crypto.randomUUID();

/**
 * Parses a servings label string (e.g., "4 portions") into separate yield and value.
 * Used when confirming an inline edit to the servings field.
 */
const parseServingsLabel = (label: string): { yield: number; value: string } => {
    const match = label.match(/(\d+)\s*(.*)/) || [];
    const yieldValue = parseInt(match[1], 10) || 1;
    let unitValue = match[2].trim();

    // Default to 'portion(s)' if unit is empty or just whitespace
    if (!unitValue || unitValue.toLowerCase().startsWith('portion')) {
        unitValue = yieldValue > 1 ? 'portions' : 'portion';
    }
    
    // The backend's Content table expects a simple number for `servings` for now.
    // We send back the yield number, but note that the actual backend model 
    // might need to be adjusted if complex units are required.
    return { yield: yieldValue, value: unitValue };
};


export function PublicationView() {
  const {
    publication,
    loading,
    selectedVariant,
    setSelectedVariant,
    checkedItems,
    toggleChecked,
    isAuthenticated,
    // Centralized API calls (Updates)
    updatePublicationField,
    updateContentField,
    updateIngredientField,
    updateSegmentField,
    // Centralized API calls (Mutations)
    addIngredient,
    deleteIngredient,
    addSegment,
    deleteSegment,
  } = usePublicationView();

  // Local UI State (Hooks must be called unconditionally)
  const [expandedBlocks, setExpandedBlocks] = useState<Record<string, boolean>>({});
  const [tab, setTab] = useState<"ingredients" | "steps">("ingredients");
  const [servingFactors, setServingFactors] = useState<Record<string, number>>({});
  
  // Inline Editing State (Managed locally and passed to InlineEditField)
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Record<string, string>>({});

  // --- Memoized Data & Handlers ---

  const contents = publication?.contents || [];
  
  const { variants, subRecipes } = useMemo(() => {
    return {
      variants: contents.filter((c: any) => !c.is_ingredient),
      subRecipes: contents.filter((c: any) => c.is_ingredient),
    };
  }, [contents]);

  const activeVariant = variants[selectedVariant] || null;
  const thumbnail = activeVariant?.gallery?.[0] || publication?.thumbnail || null;
  
  // Unified list of blocks for rendering tabs (main variant + all sub-recipes)
  const allDisplayBlocks = useMemo(() => {
    const blocks: any[] = [];
    if (activeVariant) {
      blocks.push({ ...activeVariant, __isMainVariant: true });
    }
    blocks.push(...subRecipes.map((c: any) => ({ ...c, __isMainVariant: false })));
    return blocks;
  }, [activeVariant, subRecipes]);


  const toggleBlock = useCallback((id: string) => {
    setExpandedBlocks((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const isBlockExpanded = useCallback((blockId: string, isMainVariant: boolean) =>
    expandedBlocks[blockId] !== undefined
      ? expandedBlocks[blockId]
      : isMainVariant, // Default to expanded for main variant
    [expandedBlocks]
  );

  const getServingFactor = useCallback((blockId: string) => servingFactors[blockId] || 1, [servingFactors]);
  const setServingFactor = useCallback((blockId: string, factor: number) =>
    setServingFactors((prev) => ({ ...prev, [blockId]: factor })),
    [setServingFactors]
  );
  
  // --- Standardized Inline Edit Callbacks ---

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
  
  const confirmEdit = useCallback(async (fieldId: string, resourceId: string, resourceType: 'publication' | 'content' | 'ingredient' | 'segment', fieldName: string) => {
    const value = editValues[fieldId];
    if (value === undefined || value === null) {
      cancelEdit();
      return;
    }
    
    let success = false;
    let fields: any = { [fieldName]: value };

    switch (resourceType) {
        case 'publication':
            success = await updatePublicationField(fields);
            break;
        case 'content':
            if (fieldName === 'servings') {
                const { yield: yieldValue } = parseServingsLabel(value);
                // Send only the yield number, as per current backend Content model limitations
                fields = { servings: yieldValue }; 
            }
            success = await updateContentField(resourceId, fields);
            break;
        case 'ingredient':
            if (fieldName === 'product') {
                fields = { product: { name: value } };
            } else if (fieldName === 'unit') {
                // Orchestrator payload format for updating unit relation
                fields = { ingredient_units: [{ unit: { name: value } }] };
            }
            success = await updateIngredientField(resourceId, fields);
            break;
        case 'segment':
            success = await updateSegmentField(resourceId, fields);
            break;
    }
    
    if (success) {
      cancelEdit();
    }
  }, [editValues, cancelEdit, updatePublicationField, updateContentField, updateIngredientField, updateSegmentField]);


  // --- Render Functions ---

  const renderIngredientBlocks = () => (
    <div className="pb-16 space-y-4">
      {allDisplayBlocks.map((block) => {
        const blockId = getBlockId(block);
        const isMainVariant = block.__isMainVariant;
        
        return (
          <div key={`ing-${blockId}`}>
            {/* Header for the Main Content Block (Active Variant) */}
            {isMainVariant && (
              <ContentBlockHeaderEditable
                contentId={block.content_id}
                subtitle={block.subtitle}
                servings={normalizeServings(block.servings)}
                isAuthenticated={isAuthenticated}
                editingField={editingField}
                editValues={editValues}
                startEdit={startEdit}
                cancelEdit={cancelEdit}
                updateValue={updateValue}
                confirmContent={(field) => confirmEdit(`subtitle-${block.content_id}`, block.content_id, 'content', field)}
              />
            )}
            
            <IngredientBlockEditable
              block={block}
              expanded={isBlockExpanded(`ing-${blockId}`, isMainVariant)}
              toggleBlock={() => toggleBlock(`ing-${blockId}`)}
              servingFactor={getServingFactor(`ing-${blockId}`)}
              onServingChange={(factor) => setServingFactor(`ing-${blockId}`, factor)}
              ingredients={block.content_ingredients || []}
              isAuthenticated={isAuthenticated}
              checkedItems={checkedItems}
              toggleChecked={toggleChecked}
              
              // Standardized Inline Edit Props
              editingField={editingField}
              editValues={editValues}
              startEdit={startEdit}
              cancelEdit={cancelEdit}
              updateValue={updateValue}
              confirmIngredient={(id, field) => confirmEdit(`${field}-${id}`, id, 'ingredient', field)}
              
              // Mutation hooks connection
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

        // Skip rendering segments if there are none
        if (!block.content_segments || block.content_segments.length === 0) return null;

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
            
            // Standardized Inline Edit Props
            editingField={editingField}
            editValues={editValues}
            startEdit={startEdit}
            cancelEdit={cancelEdit}
            updateValue={updateValue}
            confirmSegment={(id, field) => confirmEdit(`paragraph-${id}`, id, 'segment', field)}
            
            // Mutation hooks connection
            onAddSegment={addSegment}
            onDeleteSegment={deleteSegment}
          />
        );
      })}
    </div>
  );

  // --- Early Returns ---
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center text-gray-400">
        Chargement...
      </div>
    );
  }
  if (!publication) return null;


  // --- Main Render ---
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
        
        {/* Publication Header (Title) */}
        <PublicationHeaderEditable
          title={publication.title}
          isAuthenticated={isAuthenticated}
          isEditing={editingField === "title"}
          editValue={editValues["title"] || publication.title}
          onStartEdit={() => startEdit("title", publication.title)}
          onCancel={cancelEdit}
          onConfirm={() => confirmEdit("title", publication.publication_id, 'publication', "title")}
          onChange={(value) => updateValue("title", value)}
        />
        
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
          isEditing={editingField === "description"}
          editValue={
            editValues["description"] ||
            (publication.description || []).join("\n")
          }
          onStartEdit={() =>
            startEdit(
              "description",
              (publication.description || []).join("\n"),
            )
          }
          onCancel={cancelEdit}
          onConfirm={() => confirmEdit("description", publication.publication_id, 'publication', "description")}
          onChange={(value) => updateValue("description", value)}
        />

        {/* Variants Selector (Only renders if > 1 variant) */}
        <PublicationVariantTabs
          variants={variants}
          selectedVariant={selectedVariant}
          setSelectedVariant={setSelectedVariant}
        />

        {/* Mobile Tabs */}
        <PublicationTabs currentTab={tab} setTab={setTab} />

        {/* Content Blocks */}
        {tab === "ingredients" && renderIngredientBlocks()}
        {tab === "steps" && renderSegmentBlocks()}
      </div>
    </DotGrid>
  );
}
