"use client";
import { useState, useMemo } from "react";
import { ChevronDown, ChevronRight, Utensils, FileText } from "lucide-react";
import { usePublicationView } from "@/hooks/usePublicationView";
import { PublicationHeader } from "@/components/view/PublicationHeader";
import { PublicationVariantTabs } from "@/components/view/PublicationVariantTabs";
import { DotGrid } from "@/components/ui/DotGrid";
import { SpotlightWrapper } from "@/components/ui/SpotlightWrapper";
import { PublicationTabs } from "@/components/view/PublicationTabs";
import { SubRecipeView } from "@/components/view/SubRecipeView";
import { isIngredientMatch } from "@/utils/ingredientMatcher";

export function PublicationView() {
  const {
    publication,
    loading,
    selectedVariant,
    setSelectedVariant,
    checkedItems,
    toggleChecked,
  } = usePublicationView();

  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [tab, setTab] = useState<"ingredients" | "steps">("ingredients");

  // Définir avant toute condition
  const contents = publication?.contents || [];
  const variants = contents.filter((c: any) => !c.is_ingredient);
  const ingredientBlocks = contents.filter((c: any) => c.is_ingredient);
  const activeVariant = variants[selectedVariant] || null;

  /**
   * Construction du mapping :
   *   variant_id -> [publication_id des blocs d'ingrédients correspondants]
   */
  const variantIngredientMap = useMemo(() => {
    const map: Record<string, string[]> = {};
    for (const v of variants) {
      const variantId = v.publication_id || v.content_id || crypto.randomUUID();
      const productLines =
        v.content_ingredients?.map((i: any) => i.product?.name || "") || [];

      const matches: string[] = ingredientBlocks
        .filter((b: any) =>
          isIngredientMatch(b.subtitle || b.group || "", productLines),
        )
        .map((b: any) => b.publication_id)
        .filter(Boolean);

      map[variantId] = matches;
    }
    return map;
  }, [variants, ingredientBlocks]);

  const toggleExpand = (id: string) =>
    setExpanded((p) => ({ ...p, [id]: !p[id] }));

  if (loading)
    return (
      <div className="flex h-screen items-center justify-center text-gray-400">
        Chargement...
      </div>
    );

  if (!publication) return null;

  const activeVariantId =
    activeVariant?.publication_id || activeVariant?.content_id;
  const currentMatches = variantIngredientMap[activeVariantId] || [];

  return (
    <div className="relative min-h-screen w-full text-gray-200 overflow-hidden">
      {/* Fond animé */}
      <div className="absolute inset-0">
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
        />
      </div>

      {/* Contenu principal */}
      <div className="relative z-20 p-6">
        <PublicationHeader title={publication.title} />

        {/* Thumbnail avec effet spotlight */}
        <SpotlightWrapper
          className="w-full h-64 rounded-xl mb-6"
          radius="150px"
          spotlightColor="rgba(255,255,255,0.15)"
          softness={0.01}
        >
          {publication.thumbnail ? (
            <img
              src={publication.thumbnail}
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
        {publication.description?.length > 0 && (
          <ul className="space-y-1 text-gray-300 mb-4">
            {publication.description.map((line: string, i: number) => (
              <li key={i}>{line}</li>
            ))}
          </ul>
        )}

        {/* Variantes */}
        <PublicationVariantTabs
          variants={variants}
          selectedVariant={selectedVariant}
          setSelectedVariant={setSelectedVariant}
        />

        {/* Onglets */}
        <PublicationTabs currentTab={tab} setTab={setTab} />

        {/* Onglet : Ingrédients */}
        {tab === "ingredients" && activeVariant && (
          <section>
            <div className="border border-gray-800 rounded-xl mb-8 overflow-hidden">
              <header className="bg-[#2a2a2a]/70 px-4 py-3">
                <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                  <Utensils className="w-5 h-5 text-amber-500" />
                  {activeVariant.subtitle || publication.title || "Ingrédients"}
                </h2>
              </header>

              <div className="p-4 space-y-3 bg-[#1F1F1F]/70 border border-gray-700">
                {activeVariant.content_ingredients?.map((ing: any) => {
                  const subRecipeId = ing.product?.publication?.id;
                  const hasSubRecipe = !!subRecipeId;
                  const label = `${ing.product?.name}${
                    ing.cut ? " (" + ing.cut + ")" : ""
                  } ${
                    ing.ingredient_units?.[0]?.unit?.name
                      ? "(" + ing.ingredient_units[0].unit.name + ")"
                      : ""
                  } ${ing.quantity ? "- " + ing.quantity : ""}`;

                  const isLinked =
                    hasSubRecipe && currentMatches.includes(subRecipeId);

                  return (
                    <div key={ing.ingredient_id}>
                      <label className="flex items-center gap-2 cursor-pointer">
                        {hasSubRecipe && (
                          <button
                            onClick={() => toggleExpand(subRecipeId)}
                            className="text-amber-400 focus:outline-none"
                          >
                            {expanded[subRecipeId] ? (
                              <ChevronDown className="w-4 h-4" />
                            ) : (
                              <ChevronRight className="w-4 h-4" />
                            )}
                          </button>
                        )}

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

                      {hasSubRecipe && expanded[subRecipeId] && isLinked && (
                        <SubRecipeView subRecipeId={subRecipeId} />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* Onglet : Préparation */}
        {tab === "steps" && activeVariant && (
          <section>
            <div className="border border-gray-700 rounded-xl mb-8 overflow-hidden bg-[#1F1F1F]/70">
              <header className="bg-[#2a2a2a]/70 px-4 py-3">
                <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-amber-500" />
                  {activeVariant.subtitle || "Préparation"}
                </h2>
              </header>

              <div className="p-4 space-y-3 text-gray-300">
                {activeVariant.content_segments?.map((s: any) => (
                  <label
                    key={s.segment_id}
                    className="flex items-start gap-2 cursor-pointer"
                  >
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
                ))}
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
