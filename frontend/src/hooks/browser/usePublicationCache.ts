import { Publication } from "@/types/publication";
import { useRef, useState, useCallback } from "react";

export function usePublicationCache() {
  const entityCache = useRef<Map<string, Publication>>(new Map());
  const viewCache = useRef<Map<string, { ids: string[]; totalPages: number }>>(
    new Map(),
  );
  const [displayIds, setDisplayIds] = useState<string[]>([]);

  const loadViewFromCache = useCallback((key: string): boolean => {
    const cached = viewCache.current.get(key);
    if (!cached) return false;
    setDisplayIds(cached.ids);
    return true;
  }, []);

  const mergeIntoCache = useCallback(
    (key: string, items: Publication[], totalPages: number) => {
      for (const item of items) {
        entityCache.current.set(item.publication_id, item);
      }
      const existingIds = viewCache.current.get(key)?.ids || [];
      const newIds = items.map((i) => i.publication_id);
      const ids = Array.from(new Set([...existingIds, ...newIds]));
      viewCache.current.set(key, { ids, totalPages });
      setDisplayIds(ids);
    },
    [],
  );

  const getDisplayItems = useCallback((): Publication[] => {
    return displayIds
      .map((id) => entityCache.current.get(id))
      .filter(Boolean) as Publication[];
  }, [displayIds]);

  const clearCache = useCallback(() => {
    entityCache.current.clear();
    viewCache.current.clear();
    setDisplayIds([]);
  }, []);

  const removePrivatePublications = useCallback(() => {
    // Filter out private publications from entity cache
    const publicIds: string[] = [];
    entityCache.current.forEach((pub, id) => {
      if (pub.public === false || pub.published === false) {
        entityCache.current.delete(id);
      } else {
        publicIds.push(id);
      }
    });

    // Update view cache to only include public publication IDs
    viewCache.current.forEach((view, key) => {
      const filteredIds = view.ids.filter(id => publicIds.includes(id));
      if (filteredIds.length > 0) {
        viewCache.current.set(key, { ...view, ids: filteredIds });
      } else {
        viewCache.current.delete(key);
      }
    });

    // Update display IDs to only show public ones
    setDisplayIds(prev => prev.filter(id => publicIds.includes(id)));
  }, []);

  return { loadViewFromCache, mergeIntoCache, getDisplayItems, clearCache, removePrivatePublications };
}
