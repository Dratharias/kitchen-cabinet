import { For } from "solid-js";
import { Button } from "@/components/ui/atoms/Button";
import { ContentBlock } from "../content/ContentBlock";
import { PlusIcon } from "@/components/ui/atoms/Icons";

type PublicationContentsProps = {
  contents: any[];
  setForm: any;
  productsFetcher: () => Promise<any[]>;
  unitsFetcher: () => Promise<any[]>;
};

const newContent = () => ({
  _rid: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`,
  total_prep_time: null,
  servings: null,
  segments: [],
  ingredients: [],
  prepTimes: [],
});

export function PublicationContents(props: PublicationContentsProps) {
  const addContent = () =>
    props.setForm("contents", (prev: any[]) => [...prev, newContent()]);

  const removeContent = (index: number) =>
    props.setForm("contents", (prev: any[]) =>
      prev.filter((_, i) => i !== index),
    );

  return (
    <div>
      <div class="flex justify-between items-center mb-4">
        <h3 class="text-lg font-semibold">Contenu de la publication</h3>
      </div>

      <For each={props.contents}>
        {(content, i) => (
          <div class="mb-12">
            <ContentBlock
              content={content}
              index={i()}
              setForm={props.setForm}
              removeContent={removeContent}
              productsFetcher={props.productsFetcher}
              unitsFetcher={props.unitsFetcher}
            />
          </div>
        )}
      </For>
      <Button
        class="mx-auto"
        icon={<PlusIcon class="w-4 h-4" />}
        variant="primary"
        onClick={addContent}
      >
        Ajouter un contenu
      </Button>
    </div>
  );
}
