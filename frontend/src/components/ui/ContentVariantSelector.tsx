import React, { useState } from "react";
import AnimatedList from "./AnimatedList";

interface ContentVariant {
  id: string;
  subtitle?: string | null;
  total_prep_time?: number;
  servings?: number | null;
}

interface ContentVariantSelectorProps {
  contents: ContentVariant[];
  onSelect: (content: ContentVariant) => void;
}

export const ContentVariantSelector: React.FC<ContentVariantSelectorProps> = ({
  contents,
  onSelect,
}) => {
  const [selectedIndex, setSelectedIndex] = useState<number>(0);

  if (!contents || contents.length === 0) return null;

  // Une seule variante : rien à choisir
  if (contents.length === 1) {
    onSelect(contents[0]);
    return null;
  }

  const items = contents.map((c, i) => {
    const subtitle = c.subtitle || `Variante ${i + 1}`;
    const details: string[] = [];
    if (c.servings) details.push(`${c.servings} portions`);
    if (c.total_prep_time) details.push(`${c.total_prep_time} min`);
    return `${subtitle}${details.length ? ` • ${details.join(" • ")}` : ""}`;
  });

  return (
    <div className="w-full max-w-md mx-auto mt-4">
      <h3 className="text-sm text-gray-400 mb-2">Sélectionner une variante :</h3>
      <AnimatedList
        items={items}
        onItemSelect={(_, index) => {
          setSelectedIndex(index);
          onSelect(contents[index]);
        }}
        initialSelectedIndex={selectedIndex}
        showGradients={false}
        className="rounded-lg bg-[#0d0d0d]"
        itemClassName="hover:bg-[#222]"
      />
    </div>
  );
};
