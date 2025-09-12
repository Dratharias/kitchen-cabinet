import { Component, Show, createResource, createMemo } from "solid-js";
import { useParams, useLocation } from "@solidjs/router";
import { usePublicationApi } from "../../hooks/usePublicationApi";
import { PublicationDetails } from "../../components/browser/PublicationDetails";
import type { PublicationDetails as PublicationDetailsType, ContentDetails } from "../../types/publication";

interface PublicationPageProps {
  category?: "foods" | "feeds";
}

interface MappedPublicationData extends PublicationDetailsType {
  ingredients: string[];
  preparation: string[];
  prepTime: string;
  selectedContent?: ContentDetails;
  isReview: boolean;
  category: "foods" | "feeds" | "unknown";
}

export const PublicationPage: Component<PublicationPageProps> = (props) => {
  const params = useParams<{ id: string }>();
  const location = useLocation();

  // Determine publication category from route or props
  const category = createMemo(() => {
    if (props.category) return props.category;
    
    const path = location.pathname;
    if (path.startsWith('/foods/')) return 'foods';
    if (path.startsWith('/feeds/')) return 'feeds';
    if (path.startsWith('/review/')) return 'feeds'; // Reviews are typically feeds
    return 'unknown';
  });

  // Determine if this is a review based on type or route
  const isReview = createMemo(() => {
    const path = location.pathname;
    return path.startsWith('/review/');
  });

  // Fetch publication data
  const [publication] = createResource<PublicationDetailsType, string>(
    () => params.id,
    async (id) => {
      if (!id) throw new Error("Publication ID is required");
      return usePublicationApi.getPublication(id);
    }
  );

  // Transform publication data for component consumption
  const mappedData = createMemo((): MappedPublicationData | null => {
    const pub = publication();
    if (!pub) return null;

    // Get the primary content (first content item)
    const content: ContentDetails | undefined = pub.contents?.[0];

    // Handle publications without content
    if (!content) {
      return {
        ...pub,
        ingredients: [],
        preparation: [],
        prepTime: "0 min",
        isReview: isReview() || pub.type?.strValue === "Review",
        category: category(),
      };
    }

    // Process ingredients into readable format
    const ingredients = content.ingredients.map((ingredient) => {
      const quantity = ingredient.quantity ? `${ingredient.quantity} ` : "";
      const units = ingredient.units?.map((u) => u.name).join(", ") || "";
      const unitsText = units ? `${units} ` : "";
      return `${quantity}${unitsText}${ingredient.product.name}`.trim();
    });

    // Process preparation steps from segments
    const preparation = content.segments
      .sort((a, b) => a.order - b.order)
      .map((segment) => {
        // Include title if available
        const title = segment.title ? `${segment.title}: ` : "";
        return `${title}${segment.paragraph}`;
      });

    // Calculate total preparation time
    const totalPrepTime = content.prepTimes.reduce(
      (sum, prepTime) => sum + prepTime.duration,
      0
    );

    // Format prep time with proper units
    const formatPrepTime = (minutes: number): string => {
      if (minutes === 0) return "0 min";
      if (minutes < 60) return `${minutes} min`;
      
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      
      if (remainingMinutes === 0) return `${hours}h`;
      return `${hours}h ${remainingMinutes}min`;
    };

    return {
      ...pub,
      ingredients,
      preparation,
      prepTime: formatPrepTime(totalPrepTime),
      selectedContent: content,
      isReview: isReview() || pub.type?.strValue === "Review",
      category: category(),
    };
  });

  // Loading state
  const isLoading = () => publication.loading;
  
  // Error state
  const error = () => publication.error;

  return (
    <div class="p-0">
      <Show when={error()}>
        <div class="p-4 text-red-600">
          <h2 class="text-xl font-bold mb-2">Error loading publication</h2>
          <p>{error()?.message || "An unexpected error occurred"}</p>
        </div>
      </Show>

      <Show when={isLoading()}>
        <div class="p-4">
          <div class="animate-pulse">
            <div class="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div class="h-4 bg-gray-200 rounded w-full mb-2"></div>
            <div class="h-4 bg-gray-200 rounded w-5/6 mb-2"></div>
            <div class="h-4 bg-gray-200 rounded w-4/6"></div>
          </div>
        </div>
      </Show>

      <Show when={mappedData() && !isLoading() && !error()} keyed>
        {(data: any) => (
          <PublicationDetails 
            {...data}
            isReview={data.isReview}
            category={data.category}
          />
        )}
      </Show>
    </div>
  );
};