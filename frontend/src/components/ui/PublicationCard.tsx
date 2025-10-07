"use client";

import React, { useRef, useState } from "react";

interface Position {
  x: number;
  y: number;
}

interface PublicationCardProps {
  title: string;
  description?: string[];
  tags?: string[];
  thumbnail?: string | null;
  onClick?: () => void;
  className?: string;
  spotlightColor?: `rgba(${number}, ${number}, ${number}, ${number})`;
}

export function PublicationCard({
  title,
  description = [],
  tags = [],
  thumbnail,
  onClick,
  className = "",
  spotlightColor = "rgba(255, 255, 255, 0.15)",
}: PublicationCardProps) {
  const divRef = useRef<HTMLDivElement>(null);
  const [isFocused, setIsFocused] = useState<boolean>(false);
  const [position, setPosition] = useState<Position>({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState<number>(0);

  const handleMouseMove: React.MouseEventHandler<HTMLDivElement> = (e) => {
    if (!divRef.current || isFocused) return;
    const rect = divRef.current.getBoundingClientRect();
    setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  const handleFocus = () => {
    setIsFocused(true);
    setOpacity(0.5);
  };

  const handleBlur = () => {
    setIsFocused(false);
    setOpacity(0);
  };

  const handleMouseEnter = () => setOpacity(0.5);
  const handleMouseLeave = () => setOpacity(0);

  return (
    <div
      ref={divRef}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`relative rounded-2xl border border-neutral-800 bg-[#161616] overflow-hidden shadow-md hover:shadow-lg transition-transform duration-300 cursor-pointer ${className}`}
    >
      {/* Effet spotlight */}
      <div
        className="pointer-events-none absolute inset-0 transition-opacity duration-300 ease-in-out"
        style={{
          opacity,
          background: `radial-gradient(circle at ${position.x}px ${position.y}px, ${spotlightColor}, transparent 80%)`,
        }}
      />

      {/* Image */}
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

      {/* Contenu */}
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

        {tags?.length > 0 && (
          <div className="mt-2 text-xs text-amber-400 truncate">
            {tags.slice(0, 4).join(", ")}
          </div>
        )}
      </div>
    </div>
  );
}
