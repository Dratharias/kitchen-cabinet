import { createSignal, createEffect, Component } from "solid-js";
import Button from "../atoms/Button";

interface IngredientPrepTogglerProps {
  active: "ingredient" | "preparation";
  toggleContent: (toggle: "ingredient" | "preparation") => void;
}

export const IngredientPrepToggler: Component<IngredientPrepTogglerProps> = (props) => {
  // Toujours sélectionner "ingredient" par défaut
  const [activeKey, setActiveKey] = createSignal<"ingredient" | "preparation">("ingredient");

  // Persistance dans localStorage (optionnelle)
  createEffect(() => {
    localStorage.setItem("activeContent", activeKey());
  });

  const activate = (key: "ingredient" | "preparation") => {
    setActiveKey(key);
    props.toggleContent(key);
  };

  const isActive = (key: "ingredient" | "preparation") => activeKey() === key;

  return (
    <nav class="w-full">
      <div class="max-w-md sm:max-w-lg md:max-w-2xl mx-auto p-2 border-none">
        <div class="flex items-center h-16 text-center">
          <Button
            class="rounded-l-md rounded-r-none border-r-0"
            active={isActive("ingredient")}
            onClick={() => activate("ingredient")}
          >
            Ingrédients
          </Button>
          <Button
            class="rounded-r-md rounded-l-none"
            active={isActive("preparation")}
            onClick={() => activate("preparation")}
          >
            Préparation
          </Button>
        </div>
      </div>
    </nav>
  );
};

