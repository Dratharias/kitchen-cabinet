import { IngredientList } from "../recipe/IngredientList";
import { Button } from "../ui/atoms/Button";
import { TrashIcon } from "../ui/atoms/Icons";
import { Span } from "../ui/atoms/Span";
import { ContentMetaFields } from "./ContentMetaFields";
import { SegmentList } from "./SegmentList";

type ContentBlockProps = {
  content: any;
  index: number;
  setForm: any;
  removeContent: (index: number) => void;
  productsFetcher: () => Promise<any[]>;
  unitsFetcher: () => Promise<any[]>;
};

export function ContentBlock(props: ContentBlockProps) {
  return (
    <div class="mb-4 border p-4 rounded-xl">
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

      <ContentMetaFields
        content={props.content}
        index={props.index}
        setForm={props.setForm}
      />

      <SegmentList
        contentIndex={props.index}
        segments={props.content.segments}
        setForm={props.setForm}
      />

      <IngredientList
        contentIndex={props.index}
        ingredients={props.content.ingredients}
        setForm={props.setForm}
        productsFetcher={props.productsFetcher}
        unitsFetcher={props.unitsFetcher}
      />
    </div>
  );
}
