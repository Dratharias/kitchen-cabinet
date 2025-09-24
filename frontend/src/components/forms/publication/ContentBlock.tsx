import { Input } from "@/components/ui/atoms/Input";
import { Button } from "@/components/ui/atoms/Button";
import { SegmentList } from "./SegmentList";
import { IngredientList } from "./IngredientList";

export function ContentBlock({ content, index, setForm, removeContent, products, units }) {
  return (
    <div class="border border-gray-200 rounded-lg p-4 mb-4">
      <div class="flex justify-between items-center mb-4">
        <h4 class="font-medium">Contenu {index + 1}</h4>
        <Button type="button" onClick={() => removeContent(index)}>
          Supprimer
        </Button>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label class="block text-sm font-medium mb-1">Temps de préparation (min)</label>
          <Input
            type="number"
            value={content.total_prep_time ?? ""}
            onInput={(e) => setForm("contents", index, "total_prep_time", Number(e.currentTarget.value))}
          />
        </div>
        <div>
          <label class="block text-sm font-medium mb-1">Portions</label>
          <Input
            type="number"
            value={content.servings ?? ""}
            onInput={(e) => setForm("contents", index, "servings", Number(e.currentTarget.value))}
          />
        </div>
      </div>

      <SegmentList contentIndex={index} segments={content.segments} setForm={setForm} />
      <IngredientList contentIndex={index} ingredients={content.ingredients} setForm={setForm} products={products} units={units} />
    </div>
  );
}
