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
  productsFetcher: () => Promise<any[]>;
  unitsFetcher: () => Promise<any[]>;
};

export function IngredientList(props: IngredientListProps) {
  const actions = createIngredientFormActions(
    props.contentIndex,
    props.ingredients,
    props.setForm,
  );

  return (
    <div class="space-y-6">
      <div class="rounded-lg border p-6 shadow-sm">
        <div class="flex items-center justify-between mb-6">
          <Span class="text-xl font-semibold">Ingrédients</Span>
          <Span class="text-sm">
            {props.ingredients.length} ingrédient
            {props.ingredients.length !== 1 ? "s" : ""}
          </Span>
        </div>

        <div class="space-y-4">
          <For each={props.ingredients}>
            {(ing, i) => (
              <IngredientCard
                index={i()}
                ing={ing}
                actions={actions}
                productsFetcher={props.productsFetcher}
                unitsFetcher={props.unitsFetcher}
              />
            )}
          </For>

          <div class="flex justify-center pt-4">
            <Button
              icon={<PlusIcon class="w-4 h-4" />}
              variant={props.ingredients.length === 0 ? "primary" : "secondary"}
              onClick={actions.addIngredient}
              class="flex items-center gap-2"
            >
              {props.ingredients.length === 0
                ? "Ajouter le premier ingrédient"
                : "Ajouter un ingrédient"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
