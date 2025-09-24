import { For, Show } from "solid-js";
import { Input } from "@/components/ui/atoms/Input";
import { Button } from "@/components/ui/atoms/Button";

export function IngredientList({ contentIndex, ingredients, setForm, products, units }) {
  const addIngredient = () =>
    setForm("contents", contentIndex, "ingredients", [...ingredients, { quantity: 0, multiply_factor: 1, product_id: "", product_name: "", product_en_name: "", unit: "", isNewProduct: false, publication_id: "" }]);

  const removeIngredient = (i: number) =>
    setForm("contents", contentIndex, "ingredients", ingredients.filter((_: any, idx: number) => idx !== i));

  const handleProductChange = (ingredientIndex: number, value: string) => {
    const selected = products?.find((p: any) => p.product_id === value);
    if (selected) {
      setForm("contents", contentIndex, "ingredients", ingredientIndex, {
        product_id: selected.product_id,
        product_name: selected.name,
        product_en_name: selected.en_name || selected.name,
        isNewProduct: false,
        publication_id: ""
      });
    } else if (value === "new") {
      setForm("contents", contentIndex, "ingredients", ingredientIndex, {
        product_id: "",
        product_name: "",
        product_en_name: "",
        isNewProduct: true,
        publication_id: ""
      });
    }
  };

  return (
    <div>
      <div class="flex justify-between items-center mb-2">
        <h5 class="font-medium">Ingrédients</h5>
        <Button type="button" onClick={addIngredient}>+ Ajouter un ingrédient</Button>
      </div>

      <For each={ingredients}>
        {(ing: any, i) => (
          <div class="border border-gray-100 rounded p-3 mb-2">
            <div class="flex justify-between items-center mb-2">
              <span class="text-sm font-medium">Ingrédient {i() + 1}</span>
              <Button type="button" onClick={() => removeIngredient(i())}>Supprimer</Button>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-2 mb-2">
              <Input
                type="number"
                placeholder="Quantité"
                value={ing.quantity}
                onInput={(e) => setForm("contents", contentIndex, "ingredients", i(), "quantity", Number(e.currentTarget.value))}
              />
              <Input
                type="number"
                step="0.1"
                placeholder="Facteur multiplicateur"
                value={ing.multiply_factor}
                onInput={(e) => setForm("contents", contentIndex, "ingredients", i(), "multiply_factor", Number(e.currentTarget.value))}
              />
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-2 mb-2">
              <select
                class="px-3 py-2 border border-gray-300 rounded-md"
                value={ing.unit}
                onChange={(e) => setForm("contents", contentIndex, "ingredients", i(), "unit", e.currentTarget.value)}
              >
                <option value="">Unité</option>
                <Show when={units}>
                  <For each={units}>
                    {(u: any) => <option value={u.name}>{u.name}</option>}
                  </For>
                </Show>
              </select>

              <select
                class="px-3 py-2 border border-gray-300 rounded-md"
                value={ing.isNewProduct ? "new" : ing.product_id}
                onChange={(e) => handleProductChange(i(), e.currentTarget.value)}
              >
                <option value="">Produit</option>
                <Show when={products}>
                  <For each={products}>
                    {(p: any) => <option value={p.product_id}>{p.name}</option>}
                  </For>
                </Show>
                <option value="new">+ Nouveau produit</option>
              </select>
            </div>

            <Show when={ing.isNewProduct}>
              <div class="grid grid-cols-1 md:grid-cols-3 gap-2">
                <Input
                  placeholder="Nom du produit"
                  value={ing.product_name}
                  onInput={(e) => setForm("contents", contentIndex, "ingredients", i(), "product_name", e.currentTarget.value)}
                />
                <Input
                  placeholder="Nom anglais"
                  value={ing.product_en_name}
                  onInput={(e) => setForm("contents", contentIndex, "ingredients", i(), "product_en_name", e.currentTarget.value)}
                />
                <Input
                  placeholder="ID Publication liée"
                  value={ing.publication_id}
                  onInput={(e) => setForm("contents", contentIndex, "ingredients", i(), "publication_id", e.currentTarget.value)}
                />
              </div>
            </Show>
          </div>
        )}
      </For>
    </div>
  );
}
