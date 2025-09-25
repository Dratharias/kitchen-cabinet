import { Show, For } from "solid-js";
import { Input } from "@/components/ui/atoms/Input";
import { Span } from "@/components/ui/atoms/Span";

export function UnitSelector(props: {
  ing: any;
  index: number;
  options: any[];
  setLoadUnits: (v: boolean) => void;
  actions: any;
}) {
  return (
    <div class="space-y-2">
      <Span class="text-sm font-medium">Unité</Span>
      <select
        class="w-full px-3 py-2 border rounded-md"
        value={props.ing.unit}
        onClick={() => props.setLoadUnits(true)}
        onChange={(e) =>
          props.actions.updateUnit(props.index, e.currentTarget.value)
        }
      >
        <option value="">Sélectionner une unité</option>
        <Show when={props.options}>
          <For each={props.options}>
            {(o) => <option value={o.str_value}>{o.str_value}</option>}
          </For>
        </Show>
        <option value="new">+ Nouvelle unité</option>
      </select>
      <Show when={props.ing.unit === "new"}>
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
