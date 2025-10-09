import { Clock, Users, Utensils, FileText } from "lucide-react";

export function PublicationVariantBlock({
  block,
  servingFactor,
  checkedItems,
  toggleChecked,
}: any) {
  const ingredients = block.content_ingredients || [];
  const steps = block.content_segments || [];

  return (
    <div className="border border-gray-800 rounded-xl mb-8 overflow-hidden">
      <header className="bg-[#2a2a2a] px-4 py-3 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <Utensils className="w-5 h-5 text-amber-500" />
            {block.subtitle}
          </h2>
          <div className="flex gap-4 mt-1 text-sm text-gray-400">
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4 text-amber-400" />{" "}
              {block.total_prep_time ?? 0} min
            </span>
            {block.servings && (
              <span className="flex items-center gap-1">
                <Users className="w-4 h-4 text-amber-400" />
                {Math.round(block.servings * servingFactor)} portions
              </span>
            )}
          </div>
        </div>
      </header>

      <div className="p-4">
        <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
          <Utensils className="w-5 h-5 text-amber-500" /> Ingrédients
        </h3>
        <ul className="space-y-2 text-gray-300 mb-4">
          {ingredients.map((ing: any) => (
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
                  {ing.product?.name} {ing.cut ? "(" + ing.cut + ")" : ""}{" "}
                  {ing.ingredient_units?.[0]?.unit?.name &&
                    `(${ing.ingredient_units[0].unit.name})`}
                </span>
              </label>
            </li>
          ))}
        </ul>

        <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
          <FileText className="w-5 h-5 text-amber-500" /> Préparation
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
      </div>
    </div>
  );
}
