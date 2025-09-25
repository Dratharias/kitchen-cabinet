import { Show, For } from "solid-js";

export function PublicationSelector(props: {
  ing: any;
  index: number;
  options: any[];
  setLoadPublications: (v: boolean) => void;
  actions: any;
}) {
  return (
    <div class="space-y-2">
      <select
        class="w-full px-3 py-2 rounded-md border hover:cursor-pointer"
        value={props.ing.publication_id}
        onClick={() => props.setLoadPublications(true)}
        onChange={(e) =>
          props.actions.updatePublicationId(props.index, e.currentTarget.value)
        }
      >
        <option value="">Sélectionner une publication</option>
        <Show when={props.options}>
          <For each={props.options}>
            {(p) => <option value={p.str_value}>{p.label}</option>}
          </For>
        </Show>
      </select>
    </div>
  );
}
