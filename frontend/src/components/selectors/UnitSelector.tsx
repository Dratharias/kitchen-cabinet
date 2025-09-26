import { SearchSelect } from "./SearchSelect";

type UnitSelectorProps = {
  ing: any;
  index: number;
  options: { value: string; label: string }[];
  actions: {
    updateUnit: (index: number, id: string) => void;
    updateIsNewUnit: (index: number, isNew: boolean) => void;
  };
};

export function UnitSelector(props: UnitSelectorProps) {
  return (
    <div class="flex space-y-2 text-nowrap">
      <SearchSelect
        value={props.ing.unit} // id ou label
        options={[
          ...props.options,
          { value: "new", label: "+ Nouvelle unité" },
        ]}
        placeholder="Rechercher une unité..."
        displayLabel={
          // 1) si id connu -> label d'option
          props.options.find((o) => o.value === props.ing.unit)?.label ??
          // 2) sinon fallback sur nom brut (ex. .name si présent sur l'ingrédient)
          (props.ing.unit_name || props.ing.name || props.ing.unit)
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
