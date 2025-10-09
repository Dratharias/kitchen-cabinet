"use client";
import { useState, useEffect } from "react";
import { ChevronDown, ChevronRight, Utensils, FileText } from "lucide-react";
import { usePublicationView } from "@/hooks/usePublicationView";
import { PublicationHeader } from "@/components/view/PublicationHeader";
import { PublicationVariantTabs } from "@/components/view/PublicationVariantTabs";
import { PublicationTabsMobile } from "@/components/view/PublicationTabsMobile";
import DotGrid from "@/components/ui/DotGrid";
import { SpotlightWrapper } from "@/components/ui/SpotlightWrapper";
import { ContentWithRelations } from "@/types";

const API_BASE =
  import.meta.env.VITE_API_URL ||
  `http://localhost:${import.meta.env.VITE_API_PORT}`;

export function PublicationView() {
  const {
    publication,
    loading,
    isMobile,
    selectedVariant,
    setSelectedVariant,
    mobileTab,
    setMobileTab,
    checkedItems,
    toggleChecked,
  } = usePublicationView();

  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  if (loading)
    return (
      <div className="flex h-screen items-center justify-center text-gray-400">
        Chargement...
      </div>
    );

  if (!publication) return null;

  const contents = publication.contents || [];
  const variants = contents.filter((c: any) => !c.is_ingredient);
  const ingredientBlocks = contents.filter((c: any) => c.is_ingredient);
  const activeVariant = variants[selectedVariant] || null;

  const linkedSubIds = new Set(
    activeVariant?.content_ingredients
      ?.map((i: any) => i.product?.publication?.id)
      .filter(Boolean),
  );
  const visibleIngredients = ingredientBlocks.filter((b: any) =>
    linkedSubIds.has(b.publication_id),
  );

  const toggleExpand = (id: string) =>
    setExpanded((p) => ({ ...p, [id]: !p[id] }));

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

        {/* Thumbnail avec spotlight */}
        <SpotlightWrapper
          className="w-full h-64 rounded-xl mb-6"
          radius="150px"
          spotlightColor="rgba(255,255,255,1)"
          softness={0}
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

        {/* Onglets mobile */}
        {isMobile && (
          <PublicationTabsMobile
            mobileTab={mobileTab}
            setMobileTab={setMobileTab}
          />
        )}

        {/* Ingrédients */}
        {(!isMobile || mobileTab === "ingredients") && activeVariant && (
          <section>
            <div className="border border-gray-800 rounded-xl mb-8 overflow-hidden">
              <header className="bg-[#2a2a2a]/70 px-4 py-3 flex justify-between items-center">
                <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                  <Utensils className="w-5 h-5 text-amber-500" />
                  {activeVariant.subtitle ||
                    publication.title ||
                    "Ingrédients"}
                </h2>
              </header>

              <div className="p-4 space-y-3 bg-[#1F1F1F]/70 border border-gray-700">
                {activeVariant.content_ingredients?.map((ing: any) => {
                  const subRecipeId = ing.product?.publication?.id;
                  const hasSubRecipe = !!subRecipeId;
                  const label = `${ing.product?.name}${ing.cut ? " (" + ing.cut + ")" : ""} ${
                    ing.ingredient_units?.[0]?.unit?.name
                      ? "(" + ing.ingredient_units[0].unit.name + ")"
                      : ""
                  } ${ing.quantity ? "- " + ing.quantity : ""}`;

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

                      {hasSubRecipe &&
                        expanded[subRecipeId] &&
                        visibleIngredients.some(
                          (b: any) => b.publication_id === subRecipeId,
                        ) && <SubRecipeView subRecipeId={subRecipeId} />}
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* Préparation */}
        {(!isMobile || mobileTab === "steps") && activeVariant && (
          <section>
            <div className="border border-gray-700 rounded-xl mb-8 overflow-hidden bg-[#1F1F1F]/70">
              <header className="bg-[#2a2a2a]/70 px-4 py-3 flex justify-between items-center">
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

/* --- Sous-recette --- */
function SubRecipeView({ subRecipeId }: { subRecipeId: string }) {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function load() {
      if (loading || data) return;
      setLoading(true);
      const token = localStorage.getItem("auth_token");
      const res = await fetch(`${API_BASE}/api/publications/${subRecipeId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setData(await res.json());
      setLoading(false);
    }
    load();
  }, [subRecipeId]);

  if (loading)
    return <div className="pl-8 text-gray-500 text-sm">Chargement…</div>;
  if (!data) return null;

  const blocks = data.contents?.filter((c: any) => c.is_ingredient) || [];

  return (
    <div className="pl-8 mt-2 border-l border-gray-700">
      <h4 className="text-sm font-semibold text-amber-400 mb-1">
        {data.title}
      </h4>
      <ul className="text-gray-300 text-sm space-y-1">
        {blocks.flatMap((b: any) =>
          (b.content_ingredients || []).map((i: any) => (
            <li key={i.ingredient_id}>
              {i.product?.name}{" "}
              {i.ingredient_units?.[0]?.unit?.name
                ? "(" + i.ingredient_units[0].unit.name + ")"
                : ""}
              {i.quantity ? " - " + i.quantity : ""}
            </li>
          )),
        )}
      </ul>
    </div>
  );
}
