import { useState, useEffect, useCallback } from "react";
import { PublicationsService } from "@/services/publications";
import { CardList } from "@/components/ui/molecules/CardList";

const getTypesByCategory = (category: "feeds" | "reviews"): string[] => {
  if (category === "reviews") return ["Review", "Article", "Guide"];
  if (category === "feeds") return ["Recette", "Ingredient"];
  return [];
};

interface ContentBrowserProps {
  feeds?: boolean;
  reviews?: boolean;
}

export function ContentBrowser({ feeds, reviews }: ContentBrowserProps) {
  const [page, setPage] = useState(1);
  const [publications, setPublications] = useState<any>(null);
  const limit = 12;

  const category: "feeds" | "reviews" = feeds
    ? "feeds"
    : reviews
      ? "reviews"
      : (() => {
        throw new Error("No category selected");
      })();

  const types = getTypesByCategory(category);

  const fetchPublications = useCallback(async () => {
    if (!types.length) {
      setPublications({ items: [], total: 0, page: 1, limit, totalPages: 1 });
      return;
    }
    const filter = types.length > 0 ? { type: types } : undefined;
    const result = await PublicationsService.getPublications({
      page,
      limit,
      filter,
    });
    setPublications(result);
  }, [page, types]);

  // Réinitialise la page si le type change
  useEffect(() => {
    setPage(1);
  }, [feeds, reviews]);

  // Fetch data
  useEffect(() => {
    fetchPublications();
  }, [fetchPublications]);

  const cards = () => {
    if (!publications?.items) return [];
    return publications.items.map((pub: any) => ({
      publication: pub,
      pathPrefix: category,
    }));
  };

  return (
    <div className="flex-1 flex flex-col w-full">
      <CardList
        cards={cards()}
        pagination={{
          page: publications?.page ?? 1,
          totalPages: publications?.totalPages ?? 1,
          onPageChange: setPage,
        }}
      />
    </div>
  );
}
