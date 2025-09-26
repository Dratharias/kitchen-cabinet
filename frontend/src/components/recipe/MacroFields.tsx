import { For } from "solid-js";
import { Input } from "@/components/ui/atoms/Input";
import { Span } from "@/components/ui/atoms/Span";
import { FormIngredient } from "./IngredientLogicHandler";
import { MacroPayload } from "@/types";

const fields: (keyof MacroPayload)[] = [
  "calories",
  "protein",
  "fiber",
  "sugar",
  "saturated",
  "trans",
  "caffein",
];

type MacroFieldsProps = {
  ing: FormIngredient;
  index: number;
  actions: {
    updateMacroField: (
      index: number,
      field: keyof MacroPayload,
      value: number,
    ) => void;
  };
};

export function MacroFields(props: MacroFieldsProps) {
  return (
    <div class="pt-4 mt-4">
      <Span class="text-sm font-medium mb-3 block">Macro nutritionnelle</Span>
      <div class="grid grid-cols-4 md:grid-cols-7 gap-2">
        <For each={fields}>
          {(field) => (
            <div class="space-y-2">
              <Span class="text-sm capitalize">{field}</Span>
              <Input
                type="number"
                placeholder="0"
                value={props.ing.macro?.[field] ?? ""}
                onInput={(e) =>
                  props.actions.updateMacroField(
                    props.index,
                    field,
                    Number(e.currentTarget.value),
                  )
                }
              />
            </div>
          )}
        </For>
      </div>
    </div>
  );
}
