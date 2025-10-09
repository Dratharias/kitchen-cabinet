import { useState, useCallback, useEffect, useRef, RefObject } from "react";

interface UseSearchBarParams {
  searchInputRef: RefObject<HTMLInputElement>;
  searchButtonRef: RefObject<HTMLDivElement>;
}

export function useSearchBar({ searchInputRef, searchButtonRef }: UseSearchBarParams) {
  const [searchActive, setSearchActive] = useState(false);
  const [query, setQuery] = useState("");

  const toggleSearch = useCallback((force?: boolean) => {
    setSearchActive((prev) => (typeof force === "boolean" ? force : !prev));
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (!searchActive) return;
      const target = e.target as Node;
      if (
        searchInputRef.current?.contains(target) ||
        searchButtonRef.current?.contains(target)
      ) return;
      toggleSearch(false);
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") toggleSearch(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [searchActive, toggleSearch, searchInputRef, searchButtonRef]);

  useEffect(() => {
    if (searchActive) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
  }, [searchActive, searchInputRef]);

  return { searchActive, query, setQuery, toggleSearch };
}