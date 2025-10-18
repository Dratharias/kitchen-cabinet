import React, { useState } from "react";
import { ChevronDown, ChevronRight, Loader } from "lucide-react";
import { PublicationsService } from "../../services/publications";
import type { Publication } from "../../types";
import { IngredientBlockEditable } from "./IngredientBlockEditable";
import { SegmentBlockEditable } from "./SegmentBlockEditable";

interface SubRecipeViewerProps {
  subRecipeId: string;
  initialIngredient: any;
}

const safeDecodeText = (text: string | null | undefined): string => {
  if (!text) return "";
  try {
    return decodeURIComponent(String(text));
  } catch (e) {
    return String(text).replace(/├®/g, "é").replace(/├/g, "").trim();
  }
};

export const SubRecipeViewer: React.FC<SubRecipeViewerProps> = ({
  subRecipeId,
  initialIngredient,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [subRecipe, setSubRecipe] = useState<Publication | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const loadSubRecipe = async () => {
    if (!subRecipeId || subRecipe) return;
    setIsLoading(true);
    try {
      const fetchedRecipe = await PublicationsService.getPublicationById(
        subRecipeId,
        false,
      );
      setSubRecipe(fetchedRecipe);
    } catch (error) {
      console.error("Failed to load sub-recipe:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggle = () => {
    const newExpandedState = !isExpanded;
    setIsExpanded(newExpandedState);
    if (newExpandedState && !subRecipe) {
      loadSubRecipe();
    }
  };

  const getDisplayValue = (ing: any) => {
    const unitName =
      safeDecodeText(ing.ingredient_units?.[0]?.unit?.name) ||
      safeDecodeText(ing.ingredient_units?.[0]?.name) ||
      "";
    const rawQuantity = String(ing.quantity || "").trim();
    const productName = safeDecodeText(ing.product?.name);
    return [rawQuantity, unitName, productName].filter(Boolean).join(" ");
  };

  return (
    <div className="w-full border border-amber-800/30 bg-[#2a2a2a]/30 rounded-lg overflow-hidden my-1">
      <header
        onClick={handleToggle}
        className="flex items-center justify-between p-2 cursor-pointer hover:bg-amber-800/10"
      >
        <div className="flex items-center gap-2">
          {isExpanded ? (
            <ChevronDown className="w-5 h-5 text-amber-400" />
          ) : (
            <ChevronRight className="w-5 h-5 text-amber-400" />
          )}
          <span className="font-semibold text-amber-300">
            {getDisplayValue(initialIngredient)}
          </span>
        </div>
      </header>

      {isExpanded && (
        <div className="p-3 border-t border-amber-800/30">
          {isLoading && (
            <div className="flex items-center justify-center p-4 text-gray-400">
              <Loader className="animate-spin mr-2" /> Chargement...
            </div>
          )}
          {subRecipe && (
            <div className="space-y-4">
              {subRecipe.contents?.map((content) => (
                <React.Fragment key={content.content_id}>
                  {content.content_ingredients &&
                    content.content_ingredients.length > 0 && (
                      <IngredientBlockEditable
                        block={{ subtitle: "Ingrédients" }}
                        ingredients={content.content_ingredients || []}
                        expanded={true}
                        toggleBlock={() => {}}
                        isAuthenticated={false}
                        checkedItems={{}}
                        toggleChecked={() => {}}
                        onConfirmUpdate={async () => false}
                        onDeleteIngredient={async () => false}
                        pendingAddItem={false}
                        onConfirmAdd={() => {}}
                        onCancelAdd={() => {}}
                        onAddIngredientClick={() => {}}
                      />
                    )}
                  {content.content_segments &&
                    content.content_segments.length > 0 && (
                      <SegmentBlockEditable
                        block={{ subtitle: "Préparation" }}
                        segments={content.content_segments || []}
                        expanded={true}
                        toggleBlock={() => {}}
                        isAuthenticated={false}
                        checkedItems={{}}
                        toggleChecked={() => {}}
                        onConfirmUpdate={async () => false}
                        onDeleteSegment={async () => false}
                        pendingAddItem={false}
                        onConfirmAdd={() => {}}
                        onCancelAdd={() => {}}
                        onAddSegmentClick={() => {}}
                      />
                    )}
                </React.Fragment>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
