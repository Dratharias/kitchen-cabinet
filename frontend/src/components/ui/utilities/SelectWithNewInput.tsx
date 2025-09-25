import { For, Show, createSignal, createResource } from "solid-js";
import { Input } from "@/components/ui/atoms/Input";

type Option = { str_value: string };

interface SelectWithNewInputProps {
  label: string;
  value: string;
  fetcher: () => Promise<Option[]>;
  newValue: string;
  placeholder: string;
  onChange: (val: string) => void;
  onNewValueChange: (val: string) => void;
}

export function SelectWithNewInput(props: SelectWithNewInputProps) {
  const [loadTrigger, setLoadTrigger] = createSignal(false);
  const [options] = createResource(loadTrigger, async () => {
    return props.fetcher();
  });

  return (
    <div>
      <label class="block text-sm font-medium mb-1">{props.label}</label>
      <select
        class="w-full px-3 py-2 border border-gray-300 rounded-md hover:cursor-pointer"
        value={props.value}
        onClick={() => setLoadTrigger(true)}
        onChange={(e) => props.onChange(e.currentTarget.value)}
      >
        <option value="">Sélectionner {props.label.toLowerCase()}</option>
        <Show when={options()}>
          <For each={options()}>
            {(o) => <option value={o.str_value}>{o.str_value}</option>}
          </For>
        </Show>
        <option value="new">+ Nouveau {props.label.toLowerCase()}</option>
      </select>

      <Show when={props.value === "new"}>
        <Input
          placeholder={props.placeholder}
          class="mt-2"
          value={props.newValue}
          onInput={(e) => props.onNewValueChange(e.currentTarget.value)}
        />
      </Show>
    </div>
  );
}
