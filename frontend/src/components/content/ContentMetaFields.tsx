import { Input } from "@/components/ui/atoms/Input";
import { Span } from "@/components/ui/atoms/Span";
import { JSX } from "solid-js";
import { PrepTimeTable } from "../recipe/PrepTimeTable";

interface ContentMetaFieldsProps {
  content: {
    total_prep_time?: number;
    servings?: number;
    prep_times?: {
      duration: number;
      style: string | number;
      isNewStyle?: boolean;
      style_name?: string;
    }[];
  };
  index: number;
  setForm: (
    key: string,
    index: number,
    field: string,
    value: number | any,
  ) => void;
}

export function ContentMetaFields(props: ContentMetaFieldsProps): JSX.Element {
  const handlePrepTimesChange = (
    values: { duration: number; style: string }[],
  ) => {
    props.setForm("contents", props.index, "prep_times", values);
  };

  return (
    <div class="mb-8 p-4 pb-6 space-y-6">
      <div class="flex items-center justify-evenly gap-8">
        <div class="flex flex-col w-1/2 text-left">
          <label class="text-sm font-medium">
            <Span>Temps total de préparation</Span>
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

      {/* Table de prep times */}
      <PrepTimeTable
        values={props.content.prep_times || []}
        onChange={handlePrepTimesChange}
      />
    </div>
  );
}
