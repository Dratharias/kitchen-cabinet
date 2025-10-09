"use client";

import React, { useRef, useState, useCallback } from "react";
import { motion, useInView } from "motion/react";

interface AnimatedItemProps {
  children: React.ReactNode;
  index: number;
  isSelected: boolean;
  onSelect: () => void;
}

const AnimatedItem: React.FC<AnimatedItemProps> = ({ children, index, isSelected, onSelect }) => {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount: 0.5, once: false });
  
  return (
    <motion.div
      ref={ref}
      data-index={index}
      onMouseEnter={onSelect}
      onClick={onSelect}
      initial={{ scale: 0.7, opacity: 0 }}
      animate={inView ? { scale: 1, opacity: 1 } : { scale: 0.7, opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="mb-3 cursor-pointer"
    >
      <div
        className={`p-3 rounded-lg transition-colors duration-200 ${
          isSelected ? "bg-[#222]" : "bg-[#111]"
        }`}
      >
        {children}
      </div>
    </motion.div>
  );
};

interface AnimatedListProps {
  items: string[];
  selectedIndex: number;
  onItemSelect: (index: number) => void;
  className?: string;
}

const AnimatedList: React.FC<AnimatedListProps> = ({
  items,
  selectedIndex,
  onItemSelect,
  className = "",
}) => {
  return (
    <div className={`relative w-full ${className}`}>
      <div className="max-h-[250px] overflow-y-auto p-2">
        {items.map((item, index) => (
          <AnimatedItem
            key={index}
            index={index}
            isSelected={selectedIndex === index}
            onSelect={() => onItemSelect(index)}
          >
            <p className="text-gray-200 text-sm m-0">{item}</p>
          </AnimatedItem>
        ))}
      </div>
    </div>
  );
};

interface ContentVariant {
  id: string;
  subtitle?: string | null;
  total_prep_time?: number;
  servings?: number | null;
}

interface ContentVariantSelectorProps {
  contents: ContentVariant[];
  onSelect: (content: ContentVariant) => void;
}

const ContentVariantSelector: React.FC<ContentVariantSelectorProps> = ({ contents, onSelect }) => {
  const [selectedIndex, setSelectedIndex] = useState<number>(0);

  const handleSelect = useCallback((idx: number) => {
    setSelectedIndex(idx);
    onSelect(contents[idx]);
  }, [contents, onSelect]);

  if (!contents || contents.length <= 1) {
    if (contents?.[0]) onSelect(contents[0]);
    return null;
  }

  const items = contents.map((c, i) => {
    const subtitle = c.subtitle || `Variante ${i + 1}`;
    const details: string[] = [];
    if (c.servings) details.push(`${c.servings} portions`);
    if (c.total_prep_time) details.push(`${c.total_prep_time} min`);
    return `${subtitle}${details.length ? ` • ${details.join(" • ")}` : ""}`;
  });

  return (
    <div className="mt-3 bg-[#0f0f0f] rounded-xl border border-neutral-800">
      <AnimatedList
        items={items}
        selectedIndex={selectedIndex}
        onItemSelect={handleSelect}
      />
    </div>
  );
};

interface PublicationCardProps {
  title: string;
  description?: string[];
  tags?: CategoryName[];
  thumbnail?: string | null;
  contents?: ContentVariant[];
  onClick?: () => void;
  className?: string;
  spotlightColor?: `rgba(${number}, ${number}, ${number}, ${number})`;
}

export interface CategoryName {
  str_value: string;
}

export function PublicationCard({
  title,
  description = [],
  tags = [],
  thumbnail,
  contents,
  onClick,
  className = "",
  spotlightColor = "rgba(255, 255, 255, 0.15)",
}: PublicationCardProps) {
  const divRef = useRef<HTMLDivElement>(null);
  const spotlightRef = useRef<HTMLDivElement>(null);
  const supportsHoverRef = useRef(
    typeof window !== "undefined" && window.matchMedia("(hover: hover)").matches
  );

  const handleMouseMove = useCallback<React.MouseEventHandler<HTMLDivElement>>((e) => {
    if (!supportsHoverRef.current || !divRef.current || !spotlightRef.current) return;
    const rect = divRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    spotlightRef.current.style.background = `radial-gradient(circle at ${x}px ${y}px, ${spotlightColor}, transparent 80%)`;
  }, [spotlightColor]);

  const handleMouseEnter = useCallback(() => {
    if (supportsHoverRef.current && spotlightRef.current) {
      spotlightRef.current.style.opacity = "0.5";
    }
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (supportsHoverRef.current && spotlightRef.current) {
      spotlightRef.current.style.opacity = "0";
    }
  }, []);

  return (
    <div
      ref={divRef}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`relative rounded-2xl border border-neutral-800 bg-[#161616] overflow-hidden shadow-md hover:shadow-lg transition-transform duration-300 cursor-pointer ${className}`}
    >
      <div
        ref={spotlightRef}
        className="absolute inset-0 pointer-events-none transition-opacity duration-300 ease-in-out"
        style={{
          opacity: 0,
          background: "radial-gradient(circle at 50% 50%, transparent, transparent 80%)",
          willChange: "background, opacity",
        }}
      />

      {thumbnail ? (
        <div className="relative w-full h-48 overflow-hidden">
          <img
            src={thumbnail}
            alt={title}
            className="object-cover w-full h-full transition-transform duration-500 hover:scale-105"
            loading="lazy"
          />
        </div>
      ) : (
        <div className="flex items-center justify-center h-48 bg-gray-800 text-gray-500 text-sm">
          Aucun visuel
        </div>
      )}

      <div className="p-4 flex flex-col justify-between flex-1 relative z-10">
        <div>
          <h3 className="text-white font-semibold text-lg mb-2 line-clamp-1">
            {title}
          </h3>
          {description?.length > 0 && (
            <p className="text-gray-400 text-sm line-clamp-3">
              {description[0]}
            </p>
          )}
        </div>
        {tags?.length > 0 ? (
          <div className="mt-2 text-xs text-amber-400 truncate">
            {tags.slice(0, 4).map((tag, i) => (
              <span key={i} className="mr-2">
                {tag.str_value}
              </span>
            ))}
          </div>
        ) : (
          <div className="mt-2" />
        )}
        {contents && contents.length > 0 && (
          <ContentVariantSelector
            contents={contents}
            onSelect={() => {}}
          />
        )}
      </div>
    </div>
  );
}