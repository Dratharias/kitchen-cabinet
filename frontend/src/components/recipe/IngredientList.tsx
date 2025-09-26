import { For } from "solid-js";
import { Button } from "../ui/atoms/Button";
import { PlusIcon } from "../ui/atoms/Icons";
import { Span } from "../ui/atoms/Span";
import { IngredientCard } from "./IngredientCard";
import {
  FormIngredient,
  createIngredientFormActions,
} from "./IngredientLogicHandler";

type IngredientListProps = {
  contentIndex: number;
  ingredients: FormIngredient[];
  setForm: (...args: any[]) => void;
  productsFetcher: () => Promise<{ value: string; label: string }[]>;
  unitsFetcher: () => Promise<{ value: string; label: string }[]>;
  publicationsFetcher: () => Promise<{ value: string; label: string }[]>;
};

export function IngredientList(props: IngredientListProps) {
  const actions = createIngredientFormActions(
    props.contentIndex,
    props.ingredients,
    props.setForm,
  );

  return (
    <div class="space-y-6">
      <div class="mb-8 rounded-xl p-4 pb-8">
        {/* Header */}
        <div class="flex items-center justify-between mb-6">
          <Span class="text-xl font-semibold">Ingrédients</Span>
          <Span class="text-sm">
            {props.ingredients.length} ingrédient
            {props.ingredients.length !== 1 ? "s" : ""}
          </Span>
        </div>

        {/* Ingredient cards */}
        <div class="space-y-4">
          <For each={props.ingredients}>
            {(ing, i) => (
              <IngredientCard
                index={i()}
                ing={ing}
                actions={actions}
                unitsFetcher={props.unitsFetcher}
                productsFetcher={props.productsFetcher}
                publicationsFetcher={props.publicationsFetcher}
              />
            )}
          </For>

          {/* Add button */}
          {props.ingredients.length === 0 ? (
            <Button
              class="mx-auto mt-2"
              icon={<PlusIcon class="w-4 h-4" />}
              variant="primary"
              onClick={actions.addIngredient}
            >
              Ajouter le premier ingrédient
            </Button>
          ) : (
            <Button
              class="mx-auto mt-2"
              icon={<PlusIcon class="w-4 h-4" />}
              variant="terniary"
              onClick={actions.addIngredient}
            />
          )}
        </div>
      </div>
    </div>
  );
}
