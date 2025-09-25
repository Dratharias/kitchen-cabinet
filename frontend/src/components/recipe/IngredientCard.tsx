import { useIngredientResources } from "@/hooks/useIngredientResources";
import { Input } from "../ui/atoms/Input";
import { FormIngredient } from "./IngredientLogicHandler";
import {
  getDisplayedProductName,
  getDisplayedUnitName,
} from "@/utils/displayHelpers";
import { Show } from "solid-js";
import { ProductSelector } from "../selectors/ProductSelector";
import { PublicationSelector } from "../selectors/PublicationSelector";
import { UnitSelector } from "../selectors/UnitSelector";
import { Button } from "../ui/atoms/Button";
import { TrashIcon } from "../ui/atoms/Icons";
import { Span } from "../ui/atoms/Span";
import { MacroFields } from "./MacroFields";

export function IngredientCard(props: {
  index: number;
  ing: FormIngredient;
  actions: any;
  unitsFetcher: () => Promise<any[]>;
  productsFetcher: () => Promise<any[]>;
}) {
  const {
    unitsOptions,
    setLoadUnits,
    productsOptions,
    setLoadProducts,
    publicationsOptions,
    setLoadPublications,
  } = useIngredientResources(props.unitsFetcher, props.productsFetcher);

  return (
    <div class="rounded-lg p-5">
      <div class="flex items-center justify-between mb-4 w-full">
        <div class="w-full flex-col">
          <Span class="text-lg font-medium">
            {getDisplayedProductName(productsOptions(), props.ing) ||
              `Ingrédient ${props.index + 1}`}
          </Span>

          <Show
            when={
              props.ing.quantity > 0 &&
              getDisplayedUnitName(unitsOptions(), props.ing.unit)
            }
          >
            <Span class="text-sm">
              {`${props.ing.quantity} ${getDisplayedUnitName(unitsOptions(), props.ing.unit)}`}
            </Span>
          </Show>
        </div>
        <Button
          type="button"
          variant="secondary"
          icon={<TrashIcon />}
          onClick={() => props.actions.removeIngredient(props.index)}
          class="!p-0"
        />
      </div>

      <div class="space-y-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="space-y-2">
            <Span class="text-sm font-medium">Quantité</Span>
            <Input
              type="number"
              placeholder="0"
              value={props.ing.quantity}
              onInput={(e) =>
                props.actions.updateQuantity(
                  props.index,
                  Number(e.currentTarget.value),
                )
              }
            />
          </div>
          <div class="space-y-2">
            <Span class="text-sm font-medium">Facteur multiplicateur</Span>
            <Input
              type="number"
              step="0.1"
              placeholder="1.0"
              value={props.ing.multiply_factor}
              onInput={(e) =>
                props.actions.updateMultiplyFactor(
                  props.index,
                  Number(e.currentTarget.value),
                )
              }
            />
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <UnitSelector
            ing={props.ing}
            index={props.index}
            options={unitsOptions()}
            setLoadUnits={setLoadUnits}
            actions={props.actions}
          />
          <ProductSelector
            ing={props.ing}
            index={props.index}
            options={productsOptions()}
            setLoadProducts={setLoadProducts}
            actions={props.actions}
          />
        </div>

        <Show when={props.ing.isNewProduct}>
          <div class="pt-4 border-t">
            <Span class="text-sm font-medium mb-3 block">
              Informations du nouveau produit
            </Span>
            <Input
              placeholder="Nom du nouveau produit"
              value={props.ing.product_name}
              onInput={(e) =>
                props.actions.updateProductName(
                  props.index,
                  e.currentTarget.value,
                )
              }
              class="my-4"
            />

            <Input
              placeholder="English name"
              value={props.ing.product_en_name}
              onInput={(e) =>
                props.actions.updateProductEnName(
                  props.index,
                  e.currentTarget.value,
                )
              }
            />

            <div class="flex items-center p-2">
              <Span class="text-sm mr-4">Publication liée</Span>
              <PublicationSelector
                ing={props.ing}
                index={props.index}
                options={publicationsOptions()}
                setLoadPublications={setLoadPublications}
                actions={props.actions}
              />
            </div>

            <MacroFields
              ing={props.ing}
              index={props.index}
              actions={props.actions}
            />
          </div>
        </Show>
      </div>
    </div>
  );
}
