import { Show, For } from "solid-js";
import { Span } from "@/components/ui/atoms/Span";

export function ProductSelector(props: {
  ing: any;
  index: number;
  options: any[];
  setLoadProducts: (v: boolean) => void;
  actions: any;
}) {
  return (
    <div class="space-y-2">
      <Span class="text-sm font-medium">Produit</Span>
      <select
        class="w-full px-3 py-2 border rounded-md"
        value={props.ing.isNewProduct ? "new" : props.ing.product_id}
        onClick={() => props.setLoadProducts(true)}
        onChange={(e) => {
          const val = e.currentTarget.value;
          if (val === "new") props.actions.createNewProduct(props.index);
          else props.actions.selectProduct(props.index, val);
        }}
      >
        <option value="">Sélectionner un produit</option>
        <Show when={props.options}>
          <For each={props.options}>
            {(o) => <option value={o.str_value}>{o.str_value}</option>}
          </For>
        </Show>
        <option value="new">+ Nouveau produit</option>
      </select>
    </div>
  );
}
