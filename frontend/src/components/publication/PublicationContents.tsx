import { For } from "solid-js";
import { Button } from "../ui/atoms/Button";
import { PlusIcon } from "../ui/atoms/Icons";
import { ContentBlock } from "../content/ContentBlock";

type PublicationContentsProps = {
  contents: any[];
  setForm: any;
  productsFetcher: () => Promise<{ value: string; label: string }[]>;
  unitsFetcher: () => Promise<{ value: string; label: string }[]>;
  publicationsFetcher: () => Promise<{ value: string; label: string }[]>;
};

const newContent = () => ({
  _rid: crypto.randomUUID?.() ?? `${Date.now()}-${Math.random()}`,
  total_prep_time: null,
  servings: null,
  segments: [],
  ingredients: [],
  prepTimes: [],
  publication_id: "",
});

export function PublicationContents(props: PublicationContentsProps) {
  const addContent = () =>
    props.setForm("contents", (prev: any[]) => [...prev, newContent()]);

  const removeContent = (i: number) =>
    props.setForm("contents", (prev: any[]) =>
      prev.filter((_, idx) => idx !== i),
    );

  return (
    <div class="py-8">
      <div class="flex justify-between items-center mt-4">
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
              publicationsFetcher={props.publicationsFetcher}
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
        Ajouter du contenu
      </Button>
    </div>
  );
}
