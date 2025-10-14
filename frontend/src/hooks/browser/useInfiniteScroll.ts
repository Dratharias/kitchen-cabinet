import { useEffect, useRef, useState } from "react";

interface UseInfiniteScrollParams {
  loading: boolean;
  totalPages: number;
  onLoadMore: (page: number) => void;
  threshold?: number;
}

export function useInfiniteScroll({
  loading,
  totalPages,
  onLoadMore,
  threshold = 0.3,
}: UseInfiniteScrollParams) {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (!sentinelRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !loading && page < totalPages) {
          const nextPage = page + 1;
          setPage(nextPage);
          onLoadMore(nextPage);
        }
      },
      { threshold },
    );

    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [loading, totalPages, page, onLoadMore, threshold]);

  const resetPage = () => setPage(1);

  return { sentinelRef, page, resetPage };
}
