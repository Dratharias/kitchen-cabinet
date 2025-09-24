import { For } from "solid-js";
import { Button } from "@/components/ui/atoms/Button";
import { ContentBlock } from "./ContentBlock";

export function PublicationContents({ contents, setForm, products, units }) {
  const addContent = () =>
    setForm("contents", [...contents, { total_prep_time: null, servings: null, segments: [], ingredients: [], prepTimes: [] }]);

  const removeContent = (index: number) =>
    setForm("contents", contents.filter((_: any, i: number) => i !== index));

  return (
    <div>
      <div class="flex justify-between items-center mb-4">
        <h3 class="text-lg font-semibold">Contenu de la recette</h3>
        <Button type="button" onClick={addContent}>+ Ajouter un contenu</Button>
      </div>

      <For each={contents}>
        {(content: any, i) => (
          <ContentBlock
            content={content}
            index={i()}
            setForm={setForm}
            removeContent={removeContent}
            products={products}
            units={units}
          />
        )}
      </For>
    </div>
  );
}
