"use client";

import { useEffect, useMemo, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Search } from "lucide-react";
import DotGrid from "@/components/ui/DotGrid";
import Dock from "@/components/ui/Dock";
import { PublicationCard } from "@/components/cards/PublicationCard";
import { fadeSlideVariants, fadeSlideTransition } from "@/components/animations/motionFadeSlide";
import { usePublicationCache } from "@/hooks/usePublicationCache";
import { usePublicationLoader } from "@/hooks/usePublicationLoader";
import { useSearchBar } from "@/hooks/useSearchBar";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";
import { useResponsiveColumns } from "@/hooks/useResponsiveColumns";
import {
  TYPE_MAP,
  ICON_MAP,
  LABEL_MAP,
  CATEGORIES,
  type CategoryKey,
} from "@/constants/contentBrowser";
import type { Publication } from "@/types/publication";

export function ContentBrowser() {
  const { category } = useParams();
  const navigate = useNavigate();

  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchButtonRef = useRef<HTMLDivElement>(null);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cols = useResponsiveColumns();
  const { loadViewFromCache, mergeIntoCache, getDisplayItems } = usePublicationCache();
  const { loading, totalPages, fetchPublications } = usePublicationLoader();
  const { searchActive, query, setQuery, toggleSearch } = useSearchBar({
    searchInputRef,
    searchButtonRef,
  });

  // Catégorie courante
  const selectedCategory = useMemo(() => {
    if (category && CATEGORIES.includes(category as CategoryKey)) {
      return category as CategoryKey;
    }
    return null;
  }, [category]);

  // Types courants : cast pour supprimer la readonly
  const currentTypes = useMemo(() => {
    const types =
      selectedCategory && TYPE_MAP[selectedCategory]
        ? [...TYPE_MAP[selectedCategory]]
        : Object.values(TYPE_MAP).flat();
    return types as string[];
  }, [selectedCategory]);

  const viewKey = useMemo(
    () => `${selectedCategory || "all"}::${query}`,
    [selectedCategory, query]
  );

  // Chargement des pages
  const loadPage = useCallback(
    async (pageNum: number) => {
      const items: Publication[] = await fetchPublications({
        page: pageNum,
        limit: 12,
        types: currentTypes,
        query,
      });
      mergeIntoCache(viewKey, items, totalPages);
    },
    [fetchPublications, currentTypes, query, mergeIntoCache, viewKey, totalPages]
  );

  const { sentinelRef, resetPage } = useInfiniteScroll({
    loading,
    totalPages,
    onLoadMore: loadPage,
  });

  // Premier chargement ou changement de vue
  useEffect(() => {
    if (!loadViewFromCache(viewKey)) {
      resetPage();
      loadPage(1);
    }
  }, [viewKey, loadViewFromCache, loadPage, resetPage]);

  // Recherche avec debounce
  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      if (!loadViewFromCache(viewKey)) {
        resetPage();
        loadPage(1);
      }
    }, 300);
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [query, selectedCategory, viewKey, loadViewFromCache, loadPage, resetPage]);

  // Sélection de catégorie
  const handleCategorySelect = useCallback(
    (key: CategoryKey) => {
      navigate(`/content/${key}`);
      toggleSearch(false);
    },
    [navigate, toggleSearch]
  );

  const items = getDisplayItems() as Publication[];

  // Dock dynamique
  const dockItems = useMemo(() => {
    const categoryItems = CATEGORIES.map((key) => {
      const IconComponent = ICON_MAP[key];
      return {
        icon: <IconComponent className="w-6 h-6" />,
        label: LABEL_MAP[key],
        onClick: () => handleCategorySelect(key),
      };
    });

    const searchButton = {
      icon: <Search className="w-6 h-6" />,
      label: searchActive ? "Fermer" : "Rechercher",
      onClick: () => toggleSearch(),
      className: searchActive
        ? "bg-amber-600 border-amber-700"
        : "bg-[#292929] hover:bg-[#333333]",
    };

    return [
      categoryItems[0],
      categoryItems[1],
      searchButton,
      categoryItems[2],
      categoryItems[3],
    ];
  }, [handleCategorySelect, searchActive, toggleSearch]);

  return (
    <div className="flex min-h-screen flex-col w-full relative p-8">
      {/* Fond animé */}
      <div className="absolute inset-0 w-full h-full z-0 pointer-events-none bg-[#1F1F1F]">
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
      <AnimatePresence>
        {searchActive && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 60 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="fixed w-3/5 px-6 z-50 bottom-28 left-1/2 -translate-x-1/2"
          >
            <input
              ref={searchInputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.currentTarget.value)}
              placeholder="Rechercher un contenu..."
              className="w-full h-12 rounded-md bg-[#1F1F1F] border border-gray-600 px-5 text-gray-200 text-base placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-lg"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dock principal */}
      <div
        className="fixed bottom-0 left-1/2 -translate-x-1/2 z-50"
        ref={searchButtonRef}
      >
        <Dock
          panelHeight={40}
          items={dockItems}
          magnification={70}
          expandOnHover
          bgClass="bg-[#1f1f1f]"
          borderClass="border-neutral-700"
        />
      </div>

      {/* Grille des publications */}
      <div
        className="grid gap-6 pb-24 pt-4"
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
      >
        <AnimatePresence mode="popLayout">
          {items.map((item, i) => (
            <motion.div
              key={item.publication_id}
              layout
              variants={fadeSlideVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={fadeSlideTransition(i, cols)}
              className="publication-card"
            >
              <PublicationCard
                title={item.title}
                description={
                  Array.isArray(item.description)
                    ? item.description
                    : item.description
                    ? [item.description]
                    : []
                }
                tags={item.tags}
                thumbnail={item.thumbnail}
                onClick={() => navigate(`/publication/${item.publication_id}`)}
              />
            </motion.div>
          ))}
        </AnimatePresence>

        {loading && (
          <p className="col-span-full text-center text-amber-500 mt-6">
            Chargement...
          </p>
        )}
      </div>

      <div ref={sentinelRef} className="h-10" />
    </div>
  );
}
