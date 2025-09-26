import { Show } from "solid-js";
import { Input } from "../ui/atoms/Input";
import { Button } from "../ui/atoms/Button";
import { TrashIcon } from "../ui/atoms/Icons";
import { Span } from "../ui/atoms/Span";
import { MacroFields } from "./MacroFields";
import { FormIngredient } from "./IngredientLogicHandler";
import {
  getDisplayedProductName,
  getDisplayedUnitName,
} from "@/utils/dataTransformers";
import { UnitSelector } from "../selectors/UnitSelector";
import { ProductSelector } from "../selectors/ProductSelector";
import { PublicationSearchSelect } from "../selectors/PublicationSearchSelect";

type Option = { value: string; label: string };

type IngredientCardProps = {
  index: number;
  ing: FormIngredient;
  actions: any;
  unitsOptions: Option[];
  productsOptions: Option[];
  publicationsFetcher: () => Promise<{ value: string; label: string }[]>;
};

export function IngredientCard(props: IngredientCardProps) {
  return (
    <div class="p-6">
      {/* Header */}
      <div class="flex items-center justify-between mb-4 w-full">
        <Span class="text-lg font-medium w-full">
          {props.ing.quantity > 0 ? props.ing.quantity : ""}{" "}
          {getDisplayedUnitName(props.unitsOptions, props.ing.unit) || ""}{" "}
          {props.ing.unit ? "de " : ""}
          {getDisplayedProductName(props.productsOptions, props.ing) ||
            `Ingrédient ${props.index + 1}`}{" "}
          {props.ing.multiply_factor && props.ing.multiply_factor !== 1
            ? `(x${props.ing.multiply_factor})`
            : ""}
        </Span>
        <Button
          type="button"
          variant="secondary"
          icon={<TrashIcon />}
          class="!p-0 w-fit"
          onClick={() => props.actions.removeIngredient(props.index)}
        />
      </div>

      {/* Body */}
      <div class="space-y-4">
        {/* Quantity + Factor */}
        <div class="flex gap-4">
          <div class="w-1/5">
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

          {/* Unit + Product */}
          <div class="flex w-3/5 gap-2">
            <div class="space-y-2 w-1/2">
              <Span class="text-sm font-medium">Unité de mesure</Span>
              <UnitSelector
                ing={props.ing}
                index={props.index}
                options={props.unitsOptions}
                actions={props.actions}
              />
              <Show when={props.ing.isNewUnit}>
                <Input
                  placeholder="Nouvelle unité"
                  value={props.ing.unit}
                  onInput={(e) =>
                    props.actions.updateUnit(props.index, e.currentTarget.value)
                  }
                />
              </Show>
            </div>

            <div class="space-y-2 w-1/2">
              <Span class="text-sm font-medium">Produit</Span>
              <ProductSelector
                ing={props.ing}
                index={props.index}
                options={props.productsOptions}
                actions={props.actions}
              />
            </div>
          </div>

          <div class="w-1/5">
            <Span class="text-sm font-medium text-nowrap">
              Facteur multiplicateur
            </Span>
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

        {/* New product fields */}
        <Show when={props.ing.isNewProduct}>
          <div class="pt-4 space-y-4">
            <Span class="text-sm font-medium block">
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

            {/* Link to existing publication */}
            <div class="flex items-center p-2">
              <Span class="text-sm mr-4">Publication liée</Span>
              <PublicationSearchSelect
                value={props.ing.publication_id}
                fetcher={props.publicationsFetcher}
                onSelect={(val) =>
                  props.actions.updatePublicationId(props.index, val)
                }
                placeholder="Rechercher une publication..."
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
