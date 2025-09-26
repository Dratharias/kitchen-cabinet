import { Show } from "solid-js";
import { IngredientList } from "../recipe/IngredientList";
import { Button } from "../ui/atoms/Button";
import { TrashIcon } from "../ui/atoms/Icons";
import { Span } from "../ui/atoms/Span";
import { ContentMetaFields } from "./ContentMetaFields";
import { StepList } from "./StepList";
import { PublicationSearchSelect } from "../selectors/PublicationSearchSelect";

type ContentBlockProps = {
  content: any;
  index: number;
  setForm: any;
  removeContent: (index: number) => void;
  productsFetcher: () => Promise<{ value: string; label: string }[]>;
  unitsFetcher: () => Promise<{ value: string; label: string }[]>;
  publicationsFetcher: () => Promise<{ value: string; label: string }[]>;
};

export function ContentBlock(props: ContentBlockProps) {
  const handlePublicationSelect = (publicationId: string) => {
    props.setForm("contents", props.index, "publication_id", publicationId);
  };

  const publicationId = () => props.content.publication_id;

  return (
    <div class="py-4 border-b border-dashed">
      {/* Header */}
      <div class="flex justify-center items-center mb-4">
        <Span class="text-center mx-auto text-2xl w-full ml-8">
          Contenu {props.index + 1}
        </Span>
        <Button
          class="relative !p-0"
          variant="secondary"
          onClick={() => props.removeContent(props.index)}
          icon={<TrashIcon />}
        />
      </div>

      {/* Link to existing publication */}
      <PublicationSearchSelect
        value={publicationId()}
        onSelect={handlePublicationSelect}
        fetcher={props.publicationsFetcher}
        placeholder="Lier à une publication existante"
      />

      {/* Disable rest if publication is linked */}
      <Show when={!publicationId()}>
        <ContentMetaFields
          content={props.content}
          index={props.index}
          setForm={props.setForm}
        />

        <StepList
          contentIndex={props.index}
          steps={props.content.steps}
          setForm={props.setForm}
        />

        <IngredientList
          contentIndex={props.index}
          ingredients={props.content.ingredients}
          setForm={props.setForm}
          productsFetcher={props.productsFetcher}
          unitsFetcher={props.unitsFetcher}
          publicationsFetcher={props.publicationsFetcher}
        />
      </Show>
    </div>
  );
}
