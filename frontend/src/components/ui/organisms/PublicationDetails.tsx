import { Component, createSignal, createMemo } from "solid-js";
import { useNavigate } from "@solidjs/router";
import type { ContentDetails } from "../../../shared-types/publication";
import Image from "../atoms/Image";
import NumberSpinner from "../utilities/NumberSpinner";
import { Span } from "../atoms/Span";
import { AccordionList } from "../utilities/AccordionList";
import { IngredientPrepToggler } from "../utilities/IngredientPrepToggler";
import { Checklist } from "../atoms/Checklist";
import Button from "../atoms/Button";

interface Ingredient {
  ingredientId?: string;
  product?: { productId: string; name: string };
  name?: string;
  quantity?: number;
  multiplyFactor?: number;
  units?: Array<{ name: string }>;
}

interface PublicationDetailsProps {
  publicationId: string;
  reviewsCount: number;
  averageRating: number;
  title: string;
  thumbnail?: string;
  prepTime?: string | number;
  selectedContent?: ContentDetails & { servings?: number; ingredients?: Ingredient[] };
  ingredients?: Ingredient[];
  preparation?: string[];
  description?: string[];
  note?: string[];
  isReview?: boolean;
  category?: "foods" | "feeds" | "unknown";
}

export const PublicationDetails: Component<PublicationDetailsProps> = (props) => {
  const fallbackThumbnail = "https://picsum.photos/640/480?random=42";

  const baseYield = props.selectedContent?.servings ?? 1;
  const [activeTab, setActiveTab] = createSignal<"ingredient" | "preparation">("ingredient");
  const [servings, setServings] = createSignal<number>(baseYield);
  const navigate = useNavigate();

  function getAdjustedQuantity(ingredient: Ingredient, servings: number, baseYield: number) {
    const quantity = Number(ingredient.quantity ?? 0);
    const multiply = Number(ingredient.multiplyFactor ?? 1);
    const ratio = baseYield > 0 ? servings / baseYield : 1;
    return quantity * ratio * multiply;
  }

  const ingredients = createMemo(() => props.selectedContent?.ingredients ?? []);
  
  const adjustedIngredients = createMemo(() => {
    return ingredients().map((ing) => ({
      ...ing,
      adjustedQuantity: getAdjustedQuantity(ing, servings(), baseYield),
    }));
  });

  function formatDuration(minutes: number) {
    if (!Number.isFinite(minutes) || minutes <= 0) return "0 min";
    if (minutes < 60) return `${minutes} min`;
    if (minutes < 1440) {
      const h = Math.floor(minutes / 60);
      const m = minutes % 60;
      return m > 0 ? `${h}h ${m}m` : `${h}h`;
    }
    const d = Math.floor(minutes / 1440);
    const leftover = minutes % 1440;
    const h = Math.floor(leftover / 60);
    return h > 0 ? `${d}d ${h}h` : `${d}d`;
  }

  const effectivePrep = createMemo(() => {
    const pubPrep = Number(props.selectedContent?.totalPrepTime ?? 0);
    const content = props.selectedContent ?? ({} as any);
    const segments = content.segments ?? [];

    if (pubPrep > 0) {
      return {
        label: "Temps de préparation :",
        value: formatDuration(pubPrep),
        details: content.prepTimes ?? [],
      };
    }

    const total = Number(content.totalPrepTime ?? 0);
    const segmentPrepTimes = segments.flatMap((s: any) => s.prepTimes ?? []);
    const allSegmentsHavePrep =
      segments.length > 0 ? segments.every((s: any) => (s.prepTimes?.length ?? 0) > 0) : true;

    if (total > 0) {
      return {
        label: allSegmentsHavePrep ? "Temps de préparation :" : "Temps minimum de préparation :",
        value: formatDuration(total),
        details: content.prepTimes ?? [],
      };
    } else if (segmentPrepTimes.length > 0) {
      const sum = segmentPrepTimes.reduce((acc, pt) => acc + (Number(pt?.duration ?? 0)), 0);
      return {
        label: allSegmentsHavePrep ? "Temps de préparation :" : "Temps minimum de préparation :",
        value: formatDuration(sum),
        details: segmentPrepTimes,
      };
    }

    return { label: "Temps de préparation :", value: "N/A", details: [] };
  });

  const [ingredientChecked, setIngredientChecked] = createSignal(
    ingredients().map(() => false)
  );
  
  const [prepChecked, setPrepChecked] = createSignal(
    (props.selectedContent?.segments ?? []).map(() => false)
  );

  function getIngredientDisplayName(ingredient: Ingredient): string {
    return ingredient.product?.name ?? ingredient.name ?? "Ingrédient inconnu";
  }

  function getIngredientUnit(ingredient: Ingredient): string {
    return ingredient.units?.[0]?.name ?? "";
  }

  function formatIngredientQuantity(quantity: number, unit: string): string {
    const formattedQuantity = isNaN(quantity) ? "0" : quantity.toFixed(0);
    return unit ? `${formattedQuantity} ${unit}` : formattedQuantity;
  }

  function getServingsPercentage(ingredient?: Ingredient): string {
    if (baseYield <= 0) return "";
    const ratio = servings() / baseYield;
    const multiplyFactor = ingredient?.multiplyFactor ?? 1;
    const adjustedRatio = 1 + ((ratio - 1) * multiplyFactor);
    const percentage = Math.round((adjustedRatio - 1) * 100);
    
    if (percentage === 0) return "";
    const sign = percentage > 0 ? "+" : "";
    return ` (${sign}${percentage}%)`;
  }

  const preparationSteps = createMemo(() => 
    props.selectedContent?.segments?.map(segment => segment.paragraph).filter(Boolean) ?? 
    props.preparation ?? 
    []
  );

  const renderStars = (rating: number) => {
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);

    return (
      <>
        {"★".repeat(fullStars)}
        {halfStar && "☆"}
        {"☆".repeat(emptyStars)}
      </>
    );
  };

  return (
    <div class="flex flex-col w-full text-prim-txt dark:text-prim-txt-d">
      <Image
        src={props.thumbnail ?? fallbackThumbnail}
        fallbackSrc={fallbackThumbnail}
        alt={props.title}
        class="w-full max-h-64 h-64 object-cover rounded-b mb-8"
      />

      <Span class="mt-4 px-4 text-4xl font-semibold">
        <h1>{props.title}</h1>
      </Span>
      <div class="flex items-center gap-2 px-4 mt-4">
        
      <div>
          <Button
            class="bg-layout border-none dark:bg-layout-d"
            onClick={() => {
              const id = props.publicationId;
              if (id) {
                navigate(`/foods/${id}/reviews`);
              }
            }}
          >
            <span class="text-yellow-500">
              {renderStars(props.averageRating ?? 0)}
            </span>
            <span class="ml-2 text-lg font-medium">
              {props.averageRating?.toFixed(1) ?? "N/A"}
            </span>
            <span class="text-sm text-gray-500">
              ({props.reviewsCount ?? 0} avis)
            </span>
          </Button>
      </div>
        
    </div>

      <div class="grid grid-cols-2 gap-4 px-4 mt-8">
        <AccordionList
          class="text-left mb-4 !text-prim-txt !dark:text-prim-txt-d"
          title={`${effectivePrep().label} ${effectivePrep().value}`}
          items={
            effectivePrep().details.length > 0
              ? effectivePrep().details.map(
                  (p: any, i: number) =>
                    `${p?.category?.strValue ?? `Étape ${i + 1}`} : ${formatDuration(
                      Number(p?.duration ?? 0)
                    )}`
                )
              : []
          }
        />
        <div class="flex items-center h-10">
          <Span class="mr-4 text-lg font-medium">Rendement:</Span>
          <NumberSpinner value={servings()} min={1} max={20} onChange={setServings} />
        </div>
      </div>

      <div class="block sm:grid sm:grid-cols-2 gap-4 px-4 mt-4">
        <AccordionList class="text-left mb-4" title="Description" items={props.description} />
        <AccordionList class="text-left mb-4" title="Notes" items={props.note} />
      </div>

      <IngredientPrepToggler active={activeTab()} toggleContent={setActiveTab} />

      <div class="mt-4 px-4">
        {activeTab() === "ingredient" ? (
          <Checklist
            items={adjustedIngredients().map((ingredient) => {
              const name = getIngredientDisplayName(ingredient);
              const unit = getIngredientUnit(ingredient);
              const quantity = formatIngredientQuantity(ingredient.adjustedQuantity, unit);
              const percentage = getServingsPercentage(ingredient);
              return `${name} – ${quantity}${percentage}`;
            })}
            checked={ingredientChecked()}
            onChange={(i, v) => {
              const next = [...ingredientChecked()];
              next[i] = v;
              setIngredientChecked(next);
            }}
          />
        ) : (
          <Checklist
            items={preparationSteps()}
            checked={prepChecked()}
            onChange={(i, v) => {
              const next = [...prepChecked()];
              next[i] = v;
              setPrepChecked(next);
            }}
          />
        )}
      </div>
    </div>
  );
};