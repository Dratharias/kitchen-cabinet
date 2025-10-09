import { useState, useEffect } from "react";
import {
  Utensils,
  FileText,
  ChevronDown,
  ChevronRight,
} from "lucide-react";

interface Props {
  block: any;
  checkedItems: Record<string, boolean>;
  toggleChecked: (id: string) => void;
  expandFetcher: (id: string) => Promise<any>;
  asIngredientsOnly?: boolean;
}

export function PublicationIngredientBlock({
  block,
  checkedItems,
  toggleChecked,
  expandFetcher,
  asIngredientsOnly = false,
}: Props) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const ingredients = block.content_ingredients || [];
  const steps = asIngredientsOnly ? [] : block.content_segments || [];

  const toggleExpand = (id: string) =>
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));

  return (
    <div className="border border-gray-800 rounded-xl mb-8 overflow-hidden">
      <header className="bg-[#2a2a2a] px-4 py-3 flex justify-between items-center">
        <h2 className="text-xl font-semibold text-white flex items-center gap-2">
          <Utensils className="w-5 h-5 text-amber-500" />
          {block.subtitle || "Ingrédients"}
        </h2>
      </header>

      <div className="p-4 space-y-3">
        {ingredients.map((ing: any) => {
          const hasSubRecipe = !!ing.product?.publication?.id;
          const subRecipeId = ing.product?.publication?.id;
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

              {hasSubRecipe && expanded[subRecipeId] && (
                <SubRecipeView
                  subRecipeId={subRecipeId}
                  expandFetcher={expandFetcher}
                />
              )}
            </div>
          );
        })}

        {!asIngredientsOnly && steps.length > 0 && (
          <section className="pt-4 border-t border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
              <FileText className="w-5 h-5 text-amber-500" />
              Préparation
            </h3>
            <ul className="space-y-3 text-gray-300">
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
          </section>
        )}
      </div>
    </div>
  );
}

function SubRecipeView({
  subRecipeId,
  expandFetcher,
}: {
  subRecipeId: string;
  expandFetcher: (id: string) => Promise<any>;
}) {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function load() {
      if (data || loading) return;
      setLoading(true);
      const result = await expandFetcher(subRecipeId);
      setData(result);
      setLoading(false);
    }
    load();
  }, [subRecipeId]);

  if (loading)
    return <div className="pl-8 text-gray-500 text-sm">Chargement…</div>;
  if (!data) return null;

  const ingredientBlocks =
    data.contents?.filter((c: any) => c.is_ingredient) || [];

  return (
    <div className="pl-8 mt-2 border-l border-gray-700">
      <h4 className="text-sm font-semibold text-amber-400 mb-1">
        {data.title}
      </h4>
      <ul className="text-gray-300 text-sm space-y-1">
        {ingredientBlocks.flatMap((b: any) =>
          (b.content_ingredients || []).map((i: any) => (
            <li key={i.ingredient_id}>
              {i.product?.name}{" "}
              {i.ingredient_units?.[0]?.unit?.name
                ? "(" + i.ingredient_units[0].unit.name + ")"
                : ""}
              {i.quantity ? " - " + i.quantity : ""}
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
