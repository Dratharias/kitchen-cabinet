"use client";
import { useState } from "react";
import { ChevronDown, ChevronRight, Utensils, FileText } from "lucide-react";
import { usePublicationView } from "@/hooks/view/usePublicationView";
import { PublicationHeader } from "@/components/view/PublicationHeader";
import { PublicationVariantTabs } from "@/components/view/PublicationVariantTabs";
import { PublicationTabs } from "@/components/view/PublicationTabs";
import { PublicationServingControl } from "@/components/view/PublicationServingControl";
import { DotGrid } from "@/components/ui/DotGrid";
import { SpotlightWrapper } from "@/components/ui/SpotlightWrapper";

export function PublicationView() {
  const {
    publication,
    loading,
    selectedVariant,
    setSelectedVariant,
    checkedItems,
    toggleChecked,
  } = usePublicationView();

  const [expandedBlocks, setExpandedBlocks] = useState<Record<string, boolean>>(
    {},
  );
  const [tab, setTab] = useState<"ingredients" | "steps">("ingredients");
  const [servingFactors, setServingFactors] = useState<Record<string, number>>(
    {},
  );

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center text-gray-400">
        Chargement...
      </div>
    );
  }

  if (!publication) return null;

  const contents = publication.contents || [];
  const variants = contents.filter((c: any) => !c.is_ingredient);
  const subRecipes = contents.filter((c: any) => c.is_ingredient);
  const activeVariant = variants[selectedVariant] || null;
  const thumbnail = activeVariant?.thumbnail || publication.thumbnail || null;

  const toggleBlock = (id: string) => {
    setExpandedBlocks((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const getBlockId = (block: any) => {
    return (
      block.publication_id || block.id || block.subtitle || crypto.randomUUID()
    );
  };

  const isBlockExpanded = (blockId: string, isActiveVariant: boolean) => {
    if (expandedBlocks[blockId] !== undefined) {
      return expandedBlocks[blockId];
    }
    return isActiveVariant;
  };

  const getServingFactor = (blockId: string) => {
    return servingFactors[blockId] || 1;
  };

  const setServingFactor = (blockId: string, factor: number) => {
    setServingFactors((prev) => ({ ...prev, [blockId]: factor }));
  };

  const formatIngredientLabel = (ing: any, servingFactor: number) => {
    const multiplyFactor = ing.multiply_factor || 1;
    const baseQuantity = parseFloat(ing.quantity) || 0;
    const adjustedQuantity = baseQuantity * multiplyFactor * servingFactor;

    const productName = ing.product?.name || "Ingrédient";
    const unitName = ing.ingredient_units?.[0]?.name;
    const normalizedUnit = unitName === "l" ? "L" : unitName;
    const cut = ing.cut;

    const parts = [];

    if (adjustedQuantity > 0) {
      const formatted =
        adjustedQuantity % 1 === 0
          ? adjustedQuantity.toString()
          : adjustedQuantity.toFixed(2);
      parts.push(formatted);
    }

    if (normalizedUnit) {
      parts.push(normalizedUnit);
    }

    parts.push(productName);

    if (cut) {
      parts.push(`(${cut})`);
    }

    return parts.join(" ");
  };

  const renderIngredientBlock = (
    block: any,
    isActiveVariant: boolean = false,
  ) => {
    const blockId = `ing-${getBlockId(block)}`;
    const expanded = isBlockExpanded(blockId, isActiveVariant);
    const ingredients = block.content_ingredients || [];
    const currentServingFactor = getServingFactor(blockId);

    return (
      <div
        key={blockId}
        className="border border-gray-700 rounded-lg bg-[#1F1F1F]/80 mb-4 overflow-hidden"
      >
        <header
          className="flex items-center justify-between px-4 py-2 bg-[#2a2a2a]/70 cursor-pointer"
          onClick={() => toggleBlock(blockId)}
        >
          <h3 className="text-lg font-semibold flex items-center gap-2 text-white">
            <Utensils className="w-5 h-5 text-amber-500" />
            {block.subtitle || "Ingrédients"}
          </h3>
          {expanded ? (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronRight className="w-5 h-5 text-gray-400" />
          )}
        </header>

        {expanded && (
          <div>
            <div className="px-4 py-2">
              <PublicationServingControl
                servings={block.servings}
                servingFactor={currentServingFactor}
                onServingChange={(factor) => setServingFactor(blockId, factor)}
                prepTime={block.total_prep_time}
              />
            </div>
            <ul className="p-4 pt-2 space-y-2 text-gray-300">
              {ingredients.map((ing: any) => {
                const label = formatIngredientLabel(ing, currentServingFactor);

                return (
                  <li key={ing.ingredient_id}>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!!checkedItems[ing.ingredient_id]}
                        onChange={() => toggleChecked(ing.ingredient_id)}
                        className="accent-amber-500"
                      />
                      <span
                        className={
                          checkedItems[ing.ingredient_id]
                            ? "line-through text-gray-500"
                            : ""
                        }
                      >
                        {label}
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
    );
  };

  const renderStepBlock = (block: any, isActiveVariant: boolean = false) => {
    const blockId = `step-${getBlockId(block)}`;
    const expanded = isBlockExpanded(blockId, isActiveVariant);
    const steps = block.content_segments || [];

    return (
      <div
        key={blockId}
        className="border border-gray-700 rounded-lg bg-[#1F1F1F]/80 mb-4 overflow-hidden"
      >
        <header
          className="flex items-center justify-between px-4 py-2 bg-[#2a2a2a]/70 cursor-pointer"
          onClick={() => toggleBlock(blockId)}
        >
          <h3 className="text-lg font-semibold flex items-center gap-2 text-white">
            <FileText className="w-5 h-5 text-amber-500" />
            {block.subtitle || "Préparation"}
          </h3>
          {expanded ? (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronRight className="w-5 h-5 text-gray-400" />
          )}
        </header>

        {expanded && (
          <ul className="p-4 space-y-2 text-gray-300">
            {steps.map((s: any) => (
              <li key={s.segment_id}>
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!!checkedItems[s.segment_id]}
                    onChange={() => toggleChecked(s.segment_id)}
                    className="accent-amber-500 mt-1"
                  />
                  <span
                    className={
                      checkedItems[s.segment_id]
                        ? "line-through text-gray-500"
                        : ""
                    }
                  >
                    {s.paragraph}
                  </span>
                </label>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  };

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
      <div
        className="
          relative z-20 
          mx-auto w-full 
          max-w-full 
          sm:max-w-[640px] 
          md:max-w-[768px] 
          lg:max-w-[1024px] 
          xl:max-w-[1280px] 
          2xl:max-w-[1600px] 
          [@media(min-width:1920px)]:max-w-[1800px] 
          [@media(min-width:2560px)]:max-w-[2000px] 
          px-4 sm:px-6 lg:px-8 py-6
        "
      >
        <PublicationHeader title={publication.title} />

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

        {publication.description?.length > 0 && (
          <ul className="space-y-1 text-gray-300 mb-4">
            {publication.description.map((line: string, i: number) => (
              <li key={i}>{line}</li>
            ))}
          </ul>
        )}

        <PublicationVariantTabs
          variants={variants}
          selectedVariant={selectedVariant}
          setSelectedVariant={setSelectedVariant}
        />

        <PublicationTabs currentTab={tab} setTab={setTab} />

        {tab === "ingredients" && (
          <div className="pb-16">
            {activeVariant && renderIngredientBlock(activeVariant, true)}
            {subRecipes.map((subRecipe) =>
              renderIngredientBlock(subRecipe, false),
            )}
          </div>
        )}

        {tab === "steps" && (
          <div className="pb-16">
            {activeVariant && renderStepBlock(activeVariant, true)}
            {subRecipes.map((subRecipe) => renderStepBlock(subRecipe, false))}
          </div>
        )}
      </div>
    </DotGrid>
  );
}
