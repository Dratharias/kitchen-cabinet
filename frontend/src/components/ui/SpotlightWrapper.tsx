import React, { useRef, useState } from "react";

interface SpotlightWrapperProps extends React.PropsWithChildren {
  className?: string;
  spotlightColor?: string;
  maxOpacity?: number;
  radius?: string;
  softness?: number; // nouveau: contrôle le dégradé progressif
}

export function SpotlightWrapper({
  children,
  className = "",
  spotlightColor = "rgba(255, 255, 255, 0.2)",
  maxOpacity = 0.35,
  radius = "150px",
  softness = 0.6, // proportion de "fondu" entre couleur et transparent
}: SpotlightWrapperProps) {
  const divRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState(0);

  const handleMouseMove: React.MouseEventHandler<HTMLDivElement> = (e) => {
    if (!divRef.current) return;
    const rect = divRef.current.getBoundingClientRect();
    setPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  // stops calculés en fonction du "softness"
  const innerStop = `${Math.round(softness * 60)}%`; // zone plus douce
  const midStop = `${Math.round(softness * 85)}%`;

  return (
    <div
      ref={divRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setOpacity(maxOpacity)}
      onMouseLeave={() => setOpacity(0)}
      className={`relative overflow-hidden ${className}`}
    >
      <div
        className="pointer-events-none absolute inset-0 transition-opacity duration-500 ease-in-out"
        style={{
          opacity,
          background: `radial-gradient(circle ${radius} at ${pos.x}px ${pos.y}px,
            ${spotlightColor} 0%,
            ${spotlightColor} ${innerStop},
            rgba(255,255,255,0.05) ${midStop},
            transparent 100%)`,
        }}
      />
      {children}
    </div>
  );
}
