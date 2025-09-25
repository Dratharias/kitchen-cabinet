import { Input } from "@/components/ui/atoms/Input";
import { Span } from "@/components/ui/atoms/Span";

const fields = [
  "calories",
  "protein",
  "fiber",
  "sugar",
  "saturated",
  "trans",
  "caffein",
] as const;

export function MacroFields(props: { ing: any; index: number; actions: any }) {
  return (
    <div class="pt-4 border-t mt-4">
      <Span class="text-sm font-medium mb-3 block">Macro nutritionnelle</Span>
      <div class="grid grid-cols-4 md:grid-cols-7 gap-2">
        {fields.map((field) => (
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
        ))}
      </div>
    </div>
  );
}
