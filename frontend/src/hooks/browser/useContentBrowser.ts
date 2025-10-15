"use client";

import { useEffect, useMemo, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { usePublicationCache } from "@/hooks/browser/usePublicationCache";
import { usePublicationLoader } from "@/hooks/browser/usePublicationLoader";
import { useSearchBar } from "@/hooks/browser/useSearchBar";
import { useInfiniteScroll } from "@/hooks/browser/useInfiniteScroll";
import { useResponsiveColumns } from "@/hooks/browser/useResponsiveColumns";
import {
  TYPE_MAP,
  CATEGORIES,
  type CategoryKey,
} from "@/constants/contentBrowser";
import type { Publication } from "@/types/publication";
import { useAuthStore } from "@/stores/authStore";
import { useAuth } from "@/hooks/auth/useAuth";

export function useContentBrowser() {
  const { category } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const { logout } = useAuth();

  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchButtonRef = useRef<HTMLDivElement>(null);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cols = useResponsiveColumns();
  const { loadViewFromCache, mergeIntoCache, getDisplayItems } =
    usePublicationCache();
  const { loading, totalPages, fetchPublications } = usePublicationLoader();
  const { searchActive, query, setQuery, toggleSearch } = useSearchBar({
    searchInputRef,
    searchButtonRef,
  });

  const selectedCategory = useMemo(() => {
    if (category && CATEGORIES.includes(category as CategoryKey)) {
      return category as CategoryKey;
    }
    return null;
  }, [category]);

  const currentTypes = useMemo(() => {
    return selectedCategory && TYPE_MAP[selectedCategory]
      ? [...TYPE_MAP[selectedCategory]]
      : Object.values(TYPE_MAP).flat();
  }, [selectedCategory]);

  const viewKey = useMemo(
    () => `${selectedCategory || "all"}::${query}`,
    [selectedCategory, query],
  );

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
    [
      fetchPublications,
      currentTypes,
      query,
      mergeIntoCache,
      viewKey,
      totalPages,
    ],
  );

  const { sentinelRef, resetPage } = useInfiniteScroll({
    loading,
    totalPages,
    onLoadMore: loadPage,
  });

  useEffect(() => {
    if (!loadViewFromCache(viewKey)) {
      resetPage();
      loadPage(1);
    }
  }, [viewKey, loadViewFromCache, loadPage, resetPage, isAuthenticated]);

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
  }, [
    query,
    selectedCategory,
    viewKey,
    loadViewFromCache,
    loadPage,
    resetPage,
    isAuthenticated,
  ]);

  const items = getDisplayItems() as Publication[];

  return {
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
  };
}
