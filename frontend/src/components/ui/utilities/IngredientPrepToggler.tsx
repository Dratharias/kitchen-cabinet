import { useState, useEffect } from "react";
import { Button } from "../atoms/Button";

interface IngredientPrepTogglerProps {
  active: "ingredient" | "preparation";
  toggleContent: (toggle: "ingredient" | "preparation") => void;
}

export function IngredientPrepToggler({
  active,
  toggleContent,
}: IngredientPrepTogglerProps) {
  const [activeKey, setActiveKey] = useState<"ingredient" | "preparation">(
    active || "ingredient"
  );

  // Persiste dans localStorage
  useEffect(() => {
    localStorage.setItem("activeContent", activeKey);
  }, [activeKey]);

  const activate = (key: "ingredient" | "preparation") => {
    setActiveKey(key);
    toggleContent(key);
  };

  const isActive = (key: "ingredient" | "preparation") => activeKey === key;

  return (
    <nav className="w-full">
      <div className="max-w-md sm:max-w-lg md:max-w-2xl mx-auto p-2 border-none">
        <div className="flex items-center h-16 text-center">
          <Button
            className="rounded-l-md rounded-r-none border-r-0"
            active={isActive("ingredient")}
            onClick={() => activate("ingredient")}
          >
            Ingrédients
          </Button>
          <Button
            className="rounded-r-md rounded-l-none"
            active={isActive("preparation")}
            onClick={() => activate("preparation")}
          >
            Préparation
          </Button>
        </div>
      </div>
    </nav>
  );
}
