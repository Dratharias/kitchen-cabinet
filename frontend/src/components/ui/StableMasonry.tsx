"use client";

import { useEffect, useMemo, useRef, useState } from "react";

export interface MasonryItem {
  id: string;
  [key: string]: any;
}

interface StableMasonryProps {
  items: MasonryItem[];
  minCardWidth?: number;
  gap?: number;
  renderItem: (item: MasonryItem) => React.ReactNode;
}

export function StableMasonry({
  items,
  minCardWidth = 260,
  gap = 16,
  renderItem,
}: StableMasonryProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [columns, setColumns] = useState(3);

  // responsive columns
  useEffect(() => {
    const calcColumns = () => {
      const width = containerRef.current?.offsetWidth || window.innerWidth;
      if (width > 1600) setColumns(5);
      else if (width > 1200) setColumns(4);
      else if (width > 800) setColumns(3);
      else if (width > 500) setColumns(2);
      else setColumns(1);
    };
    calcColumns();
    window.addEventListener("resize", calcColumns);
    return () => window.removeEventListener("resize", calcColumns);
  }, []);

  // split en colonnes équilibrées
  const columned = useMemo(() => {
    const cols: MasonryItem[][] = Array.from({ length: columns }, () => []);
    items.forEach((item, i) => cols[i % columns].push(item));
    return cols;
  }, [items, columns]);

  return (
    <div
      ref={containerRef}
      className="w-full grid"
      style={{
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gap,
      }}
    >
      {columned.map((col, i) => (
        <div key={i} className="flex flex-col gap-4">
          {col.map((item) => (
            <div key={item.id} className="rounded-md overflow-hidden bg-[#1f1f1f] shadow-md">
              {renderItem(item)}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
