"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { PublicationsService } from "@/services/publications";
import DotGrid from "@/components/ui/DotGrid";
import Dock from "@/components/ui/Dock";
import { FileText, BookOpen, Lightbulb, Utensils, Search } from "lucide-react";
import ClickOutsideContainer from "@/components/utilities/ClickOutsideContainer";
import { StableMasonry } from "@/components/ui/StableMasonry";
import { PublicationCard } from "@/components/cards/PublicationCard";

const TYPE_MAP = {
  books: ["Guide"],
  reviews: ["Review"],
  article: ["Article"],
  recipes: ["Recette", "Ingredient"],
};

const ICON_MAP = {
  books: <BookOpen className="w-6 h-6" />,
  reviews: <FileText className="w-6 h-6" />,
  article: <Lightbulb className="w-6 h-6" />,
  recipes: <Utensils className="w-6 h-6" />,
};

const LABEL_MAP = {
  books: "Livres",
  reviews: "Critiques",
  article: "Articles",
  recipes: "Recettes",
};

export function ContentBrowser() {
  const { category } = useParams();
  const navigate = useNavigate();

  // --- État principal ---
  const [page, setPage] = useState(1);
  const [limit] = useState(12);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [items, setItems] = useState<any[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [searchActive, setSearchActive] = useState(false);
  const [query, setQuery] = useState("");

  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const categories = useMemo(() => ["books", "reviews", "article", "recipes"], []);

  // --- Gestion de la catégorie courante depuis l’URL ---
  useEffect(() => {
    if (category && categories.includes(category)) {
      setSelectedCategory(category);
      setPage(1);
      setItems([]);
    }
  }, [category]);

  // --- Changement de catégorie depuis le dock ---
  const handleCategorySelect = (key: string) => {
    setSelectedCategory(key);
    setSearchActive(false);
    setPage(1);
    setItems([]);
    navigate(`/${key}`);
  };

  // --- Fetch publications ---
  const fetchPublications = useCallback(
    async (pageToLoad: number, reset = false) => {
      if (loading) return;
      setLoading(true);

      const types =
        selectedCategory && TYPE_MAP[selectedCategory]
          ? TYPE_MAP[selectedCategory]
          : Object.values(TYPE_MAP).flat();

      try {
        const result = await PublicationsService.getPublicPublications({
          page: pageToLoad,
          limit,
          sortBy: "title",
          order: "asc",
          filter: { type: types, q: query || undefined },
        });

        // Tri alphabétique côté client (sécurité)
        const sortedItems = [...result.items].sort((a, b) =>
          a.title.localeCompare(b.title, "fr", { sensitivity: "base" })
        );

        setItems((prev) => (reset ? sortedItems : [...prev, ...sortedItems]));
        setTotalPages(result.totalPages);
      } catch (err) {
        console.error("Erreur de chargement des publications:", err);
      } finally {
        setLoading(false);
      }
    },
    [selectedCategory, query, limit, loading]
  );

  // --- Reset quand catégorie ou recherche change ---
  useEffect(() => {
    setItems([]);
    setPage(1);
  }, [selectedCategory, query]);

  // --- Fetch initial et pagination ---
  useEffect(() => {
    fetchPublications(page, page === 1);
  }, [page]);

  // --- Scroll infini ---
  useEffect(() => {
    if (!sentinelRef.current) return;

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !loading && page < totalPages) {
        setPage((prev) => prev + 1);
      }
    }, { threshold: 0.25 });

    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [totalPages, loading, page]);

  // --- Dock items ---
  const dockItems = [
    ...categories.slice(0, 2).map((key) => ({
      icon: ICON_MAP[key],
      label: LABEL_MAP[key],
      onClick: () => handleCategorySelect(key),
    })),
    {
      icon: <Search className="w-6 h-6" />,
      label: searchActive ? "Fermer" : "Rechercher",
      onClick: () => setSearchActive((s) => !s),
      className: searchActive
        ? "bg-amber-600 border-amber-700"
        : "bg-[#292929] hover:bg-[#333333]",
    },
    ...categories.slice(2).map((key) => ({
      icon: ICON_MAP[key],
      label: LABEL_MAP[key],
      onClick: () => handleCategorySelect(key),
    })),
  ];

  // --- Rendu principal ---
  return (
    <div className="flex min-h-screen flex-col w-full relative p-8">
      {/* Fond animé */}
      <div className="absolute inset-0 w-full h-full -z-10 pointer-events-none bg-[#1F1F1F]">
        <DotGrid
          dotSize={10}
          gap={15}
          baseColor="#292929"
          activeColor="#5B4853"
          proximity={120}
          shockRadius={250}
          shockStrength={5}
          resistance={750}
          returnDuration={1.5}
        />
      </div>

      {/* Barre de recherche */}
      {searchActive && (
        <ClickOutsideContainer onClickOutside={() => setSearchActive(false)}>
          <div className="fixed w-3/5 px-6 z-50 bottom-28 left-1/2 -translate-x-1/2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.currentTarget.value)}
              placeholder="Rechercher un contenu..."
              className="w-full h-12 rounded-md bg-[#1F1F1F] border border-gray-600 px-5 text-gray-200 text-base placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-lg"
            />
          </div>
        </ClickOutsideContainer>
      )}

      {/* Dock */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 z-50">
        <Dock
          panelHeight={40}
          items={dockItems}
          magnification={70}
          expandOnHover
          bgClass="bg-[#1f1f1f]"
          borderClass="border-neutral-700"
        />
      </div>

      {/* Zone de contenu */}
      <div className="p-6 flex-1 overflow-y-auto pb-24">
        <StableMasonry
          items={items.map((i, idx) => ({
            id: `${i.publication_id}-${idx}`,
            ...i,
          }))}
          renderItem={(item) => (
            <PublicationCard
              title={item.title}
              description={item.description}
              tags={item.tags}
              thumbnail={item.thumbnail}
              onClick={() => navigate(`/publication/${item.publication_id}`)}
            />
          )}
        />

        {loading && (
          <p className="text-center text-amber-500 mt-6">Chargement...</p>
        )}
        <div ref={sentinelRef} className="h-10"></div>
      </div>
    </div>
  );
}
