import { JSX } from "solid-js";
import { SearchSelect } from "./SearchSelect";
import { useFormCache, Option, dedupe } from "@/hooks/useFormCache";

type UnitSelectorProps = {
  ing: any;
  index: number;
  options?: Option[];
  actions: {
    updateUnit: (index: number, id: string) => void;
    updateIsNewUnit: (index: number, isNew: boolean) => void;
  };
  unitsFetcher?: () => Promise<Option[]>;
};

export function UnitSelector(props: UnitSelectorProps): JSX.Element {
  const { options, ensureLoaded, prime } = useFormCache(
    "Unit",
    props.unitsFetcher,
  );
  prime(props.options); // seed local si fourni

  const merged = () => dedupe([...(props.options ?? []), ...options()]);

  return (
    <div class="flex space-y-2 text-nowrap w-full" onClick={ensureLoaded}>
      <SearchSelect
        value={props.ing.unit}
        options={[...merged(), { value: "new", label: "+ Nouvelle unité" }]}
        placeholder="Rechercher une unité..."
        displayLabel={
          merged().find((o) => o.value === props.ing.unit)?.label ??
          props.ing.unit_name ??
          props.ing.name ??
          props.ing.unit
        }
        onSelect={(val) => {
          if (val === "new") props.actions.updateIsNewUnit(props.index, true);
          else {
            props.actions.updateUnit(props.index, val);
            props.actions.updateIsNewUnit(props.index, false);
          }
        }}
        onCreate={(label) => {
          props.actions.updateUnit(props.index, label);
          props.actions.updateIsNewUnit(props.index, true);
        }}
      />
    </div>
  );
}
