import { JSX } from "solid-js";
import { SearchSelect } from "./SearchSelect";
import { useFormCache, Option, dedupe } from "@/hooks/useFormCache";

type PrepStyleSelectorProps = {
  value?: string | number;
  onSelect: (val: string) => void;
  onCreate?: (label: string) => void;
  disabled?: boolean;
  options?: Option[];
  stylesFetcher?: () => Promise<Option[]>;
};

export function PrepStyleSelector(props: PrepStyleSelectorProps): JSX.Element {
  const { options, ensureLoaded, prime } = useFormCache("PrepStyle", props.stylesFetcher);
  prime(props.options);

  const merged = () => dedupe([...(props.options ?? []), ...options()]);

  return (
    <div class="w-full" onClick={ensureLoaded} onFocus={ensureLoaded}>
      <SearchSelect
        value={props.value != null ? String(props.value) : ""}
        options={[...merged(), { value: "new", label: "+ Nouveau style" }]}
        placeholder="Rechercher ou entrer un style..."
        displayLabel={
          merged().find((o) => o.value === props.value)?.label ??
          (props.value != null ? String(props.value) : "")
        }
        allowFreeInput={true}
        allowCreate={true}
        onSelect={(val) => {
          if (val === "new") {
            props.onCreate?.("");
          } else {
            props.onSelect(val);
          }
        }}
        onCreate={(label) => {
          if (props.onCreate) props.onCreate(label);
          else props.onSelect(label);
        }}
        disabled={props.disabled}
      />
    </div>
  );
}
