import { JSX } from "solid-js";
import { SearchSelect } from "./SearchSelect";
import { useFormCache, Option, dedupe } from "@/hooks/useFormCache";

type ProductSelectorProps = {
  ing: any;
  index: number;
  options?: Option[];
  actions: {
    selectProduct: (index: number, id: string) => void;
    createNewProduct: (index: number) => void;
    updateProductName: (index: number, name: string) => void;
  };
  productsFetcher?: () => Promise<Option[]>;
};

export function ProductSelector(props: ProductSelectorProps): JSX.Element {
  const { options, ensureLoaded, prime } = useFormCache(
    "Product",
    props.productsFetcher,
  );
  prime(props.options);

  const merged = () => dedupe([...(props.options ?? []), ...options()]);

  return (
    <div class="flex space-y-2 text-nowrap w-full" onClick={ensureLoaded}>
      <SearchSelect
        value={props.ing.product_id}
        options={[...merged(), { value: "new", label: "+ Nouveau produit" }]}
        placeholder="Rechercher un produit..."
        displayLabel={
          merged().find((o) => o.value === props.ing.product_id)?.label ??
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
