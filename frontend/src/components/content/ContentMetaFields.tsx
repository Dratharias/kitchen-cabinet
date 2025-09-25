import { Input } from "@/components/ui/atoms/Input";
import { Span } from "@/components/ui/atoms/Span";
import { JSX } from "solid-js";

interface ContentMetaFieldsProps {
  content: {
    total_prep_time?: number;
    servings?: number;
  };
  index: number;
  setForm: (key: string, index: number, field: string, value: number) => void;
}

export function ContentMetaFields(props: ContentMetaFieldsProps): JSX.Element {
  return (
    <div class="flex items-center justify-evenly mb-8 gap-8 p-4 pb-6">
      <div class="flex flex-col w-1/2 text-left">
        <label class="text-sm font-medium">
          <Span>Temps de préparation</Span>
        </label>
        <Input
          type="number"
          min="0"
          class="text-sm"
          value={props.content.total_prep_time ?? ""}
          onInput={(e) => {
            const val = Math.max(0, Number(e.currentTarget.value));
            props.setForm("contents", props.index, "total_prep_time", val);
          }}
        />
      </div>
      <div class="flex flex-col w-1/2 text-left">
        <label class="text-sm font-medium">
          <Span>Portions</Span>
        </label>
        <Input
          type="number"
          min="0"
          class="text-sm"
          value={props.content.servings ?? ""}
          onInput={(e) => {
            const val = Math.max(0, Number(e.currentTarget.value));
            props.setForm("contents", props.index, "servings", val);
          }}
        />
      </div>
    </div>
  );
}
