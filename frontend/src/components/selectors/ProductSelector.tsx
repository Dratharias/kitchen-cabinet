import { SearchSelect } from "./SearchSelect";

type ProductSelectorProps = {
  ing: any;
  index: number;
  options: { value: string; label: string }[];
  actions: {
    selectProduct: (index: number, id: string) => void;
    createNewProduct: (index: number) => void;
    updateProductName: (index: number, name: string) => void;
    clearProduct?: (index: number) => void;
  };
};

export function ProductSelector(props: ProductSelectorProps) {
  return (
    <div class="flex space-y-2 text-nowrap">
      <SearchSelect
        value={props.ing.product_id}
        options={[
          ...props.options,
          { value: "new", label: "+ Nouveau produit" },
        ]}
        placeholder="Rechercher un produit..."
        displayLabel={
          props.options.find((o) => o.value === props.ing.product_id)?.label ??
          props.ing.product_name ??
          props.ing.name ??
          props.ing.product_id
        }
        onSelect={(val) =>
          val === "new"
            ? props.actions.createNewProduct(props.index)
            : props.actions.selectProduct(props.index, val)
        }
        onCreate={(label) => {
          props.actions.createNewProduct(props.index);
          props.actions.updateProductName(props.index, label);
        }}
      />
    </div>
  );
}
