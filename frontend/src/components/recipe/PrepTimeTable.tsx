import { For, Show } from "solid-js";
import { Button } from "../ui/atoms/Button";
import { Input } from "../ui/atoms/Input";
import { Span } from "../ui/atoms/Span";
import { TrashIcon, PlusIcon } from "../ui/atoms/Icons";
import { PrepStyleSelector } from "../selectors/PrepStyleSelector";

type PrepTime = {
  duration: number;
  style: string | number;
  isNewStyle?: boolean;
  style_name?: string;
};

type PrepTimeTableProps = {
  values: PrepTime[];
  onChange: (values: PrepTime[]) => void;
};

export function PrepTimeTable(props: PrepTimeTableProps) {
  const styleRefs: Record<number, HTMLInputElement | undefined> = {};

  const updateDuration = (idx: number, value: number) => {
    const next = [...props.values];
    next[idx] = { ...next[idx], duration: value };
    props.onChange(next);
  };

  const updateStyle = (idx: number, val: string | number) => {
    const next = [...props.values];
    next[idx] = { ...next[idx], style: val, isNewStyle: false, style_name: undefined };
    props.onChange(next);
  };

  const createNewStyle = (idx: number, label: string) => {
    const next = [...props.values];
    next[idx] = { ...next[idx], style: label, isNewStyle: true, style_name: label };
    props.onChange(next);
    queueMicrotask(() => styleRefs[idx]?.focus());
  };

  const updateStyleName = (idx: number, label: string) => {
    const next = [...props.values];
    next[idx] = { ...next[idx], style_name: label };
    props.onChange(next);
  };

  const removeRow = (idx: number) => {
    props.onChange(props.values.filter((_, i) => i !== idx));
  };

  const addRow = () => {
    props.onChange([...props.values, { duration: 0, style: "", isNewStyle: false }]);
  };

  return (
    <div class="space-y-2 pt-8">
      <div class="flex items-center justify-between">
        <Span class="font-medium w-full">Temps de préparation</Span>
        <Button variant="secondary" icon={<PlusIcon />} onClick={addRow} class="!px-2 !py-1">
          Ajouter
        </Button>
      </div>

      <div class="space-y-2 w-full">
        <For each={props.values}>
          {(pt, idx) => (
            <div class="flex w-full gap-2 items-start">
              <div class="w-24">
                <Input
                  type="number"
                  placeholder="Durée (min)"
                  value={pt.duration}
                  onInput={(e) => updateDuration(idx(), Number(e.currentTarget.value))}
                />
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-2 w-full items-start">
                <PrepStyleSelector
                  value={pt.isNewStyle ? undefined : pt.style}
                  onSelect={(val) => updateStyle(idx(), val)}
                  onCreate={(label) => createNewStyle(idx(), label)}
                  disabled={false}
                />

                <Show when={pt.isNewStyle}>
                  <Input
                    ref={(el) => (styleRefs[idx()] = el)}
                    placeholder="Nom du nouveau style"
                    value={pt.style_name ?? ""}
                    onInput={(e) => updateStyleName(idx(), e.currentTarget.value)}
                    class="w-full"
                  />
                </Show>
              </div>

              <Button
                variant="secondary"
                icon={<TrashIcon />}
                onClick={() => removeRow(idx())}
                class="!px-2 !py-1"
              />
            </div>
          )}
        </For>
      </div>
    </div>
  );
}
