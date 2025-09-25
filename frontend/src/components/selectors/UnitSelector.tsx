import { Show, For } from "solid-js";
import { Input } from "@/components/ui/atoms/Input";
import { Span } from "@/components/ui/atoms/Span";

export function UnitSelector(props: {
  ing: any;
  index: number;
  options: { unit_id: string; name: string }[];
  setLoadUnits: (v: boolean) => void;
  actions: any;
}) {
  return (
    <div class="space-y-2">
      <Span class="text-sm font-medium">Unité</Span>
      <select
        class="w-full px-3 py-2 border rounded-md"
        value={props.ing.isNewUnit ? "new" : props.ing.unit}
        onClick={() => props.setLoadUnits(true)}
        onChange={(e) => {
          const val = e.currentTarget.value;
          if (val === "new") {
            props.actions.updateUnit(props.index, "");
            props.actions.updateIsNewUnit(props.index, true);
          } else {
            props.actions.updateUnit(props.index, val);
            props.actions.updateIsNewUnit(props.index, false);
          }
        }}
      >
        <option value="">Sélectionner une unité</option>
        <For each={props.options}>
          {(o) => <option value={o.name}>{o.name}</option>}
        </For>
        <option value="new">+ Nouvelle unité</option>
      </select>

      <Show when={props.ing.isNewUnit}>
        <Input
          placeholder="Nouvelle unité"
          value={props.ing.unit}
          onInput={(e) =>
            props.actions.updateUnit(props.index, e.currentTarget.value)
          }
          class="mt-2"
        />
      </Show>
    </div>
  );
}
