"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Search, User } from "lucide-react";
import { PublicationCard } from "@/components/cards/PublicationCard";
import {
  fadeSlideVariants,
  fadeSlideTransition,
} from "@/components/animations/motionFadeSlide";
import { AppLayout } from "@/layouts/AppLayout";
import { useContentBrowser } from "@/hooks/browser/useContentBrowser";
import {
  ICON_MAP,
  LABEL_MAP,
  CATEGORIES,
  type CategoryKey,
} from "@/constants/contentBrowser";

export function ContentBrowser() {
  const {
    cols,
    items,
    loading,
    sentinelRef,
    searchActive,
    query,
    setQuery,
    searchInputRef,
    searchButtonRef,
    toggleSearch,
    isAuthenticated,
    logout,
    navigate,
  } = useContentBrowser();

  const handleCategorySelect = (key: CategoryKey) => {
    toggleSearch(false);
    navigate(`/${key}`);
  };

  // Génération des items de catégories
  const categoryItems = CATEGORIES.map((key) => {
    const Icon = ICON_MAP[key];
    return {
      icon: <Icon className="w-6 h-6" />,
      label: LABEL_MAP[key],
      onClick: () => handleCategorySelect(key),
    };
  });

  // Bouton recherche
  const searchItem = {
    icon: <Search className="w-6 h-6" />,
    label: searchActive ? "Fermer" : "Rechercher",
    onClick: () => toggleSearch(),
    className: searchActive
      ? "bg-amber-600 border-amber-700"
      : "bg-[#292929] hover:bg-[#333333]",
  };

  // Bouton login/logout
  const authItem = {
    icon: <User className="w-6 h-6" />,
    label: isAuthenticated ? "Déconnexion" : "Connexion",
    onClick: () => {
      if (isAuthenticated) {
        logout();
      } else {
        navigate("/login");
      }
    },
  };

  // Insertion du search au centre des catégories
  const dockItems = [
    ...categoryItems.slice(0, 2),
    searchItem,
    ...categoryItems.slice(2),
    authItem,
  ];

  return (
    <AppLayout dockItems={dockItems} searchButtonRef={searchButtonRef}>
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
                onClick={() =>
                  navigate(`/publication/${item.publication_id}`)
                }
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
    </AppLayout>
  );
}
