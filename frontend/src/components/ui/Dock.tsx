"use client";

import {
  motion,
  MotionValue,
  useMotionValue,
  useSpring,
  useTransform,
  type SpringOptions,
  AnimatePresence,
} from "motion/react";
import React, {
  useRef,
  useState,
  useCallback,
  Children,
  cloneElement,
} from "react";

export type DockItemData = {
  icon: React.ReactNode;
  label: React.ReactNode;
  onClick: () => void;
  className?: string;
};

export type DockProps = {
  items: DockItemData[];
  className?: string;
  distance?: number;
  panelHeight?: number;
  baseItemSize?: number;
  magnification?: number;
  spring?: SpringOptions;
  position?: "bottom" | "top" | "left" | "right";
  align?: "center" | "start" | "end";
  bgClass?: string;
  borderClass?: string;
  showLabels?: boolean;
  expandOnHover?: boolean;
};

/* ---------- Subcomponents ---------- */

function DockIcon({ children }: { children: React.ReactNode }) {
  return <div className="flex items-center justify-center">{children}</div>;
}

function DockLabel({
  children,
  isHovered,
}: {
  children: React.ReactNode;
  isHovered?: MotionValue<number>;
}) {
  const [isVisible, setIsVisible] = useState(false);

  const handleChange = useCallback((latest: number) => {
    setIsVisible(latest === 1);
  }, []);

  React.useEffect(() => {
    if (!isHovered) return;
    const unsub = isHovered.on("change", handleChange);
    return unsub;
  }, [isHovered, handleChange]);

  return (
    <AnimatePresence mode="wait">
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 0 }}
          animate={{ opacity: 1, y: -10 }}
          exit={{ opacity: 0, y: 0 }}
          transition={{ duration: 0.15 }}
          className="absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md border border-neutral-700 bg-[#1f1f1f] px-2 py-0.5 text-xs text-white"
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function DockItem({
  children,
  className = "",
  onClick,
  mouseX,
  spring,
  distance,
  magnification,
  baseItemSize,
}: {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  mouseX: MotionValue<number>;
  spring: SpringOptions;
  distance: number;
  magnification: number;
  baseItemSize: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isHovered = useMotionValue(0);

  // These hooks must be top-level
  const mouseDistance = useTransform(mouseX, (val) => {
    const rect = ref.current?.getBoundingClientRect() ?? {
      x: 0,
      width: baseItemSize,
    };
    return val - rect.x - baseItemSize / 2;
  });

  const targetSize = useTransform(
    mouseDistance,
    [-distance, 0, distance],
    [baseItemSize, magnification, baseItemSize],
  );

  const size = useSpring(targetSize, spring);

  const handleHoverStart = useCallback(() => isHovered.set(1), [isHovered]);
  const handleHoverEnd = useCallback(() => isHovered.set(0), [isHovered]);

  return (
    <motion.div
      ref={ref}
      style={{ width: size, height: size }}
      onHoverStart={handleHoverStart}
      onHoverEnd={handleHoverEnd}
      onClick={onClick}
      className={`relative inline-flex items-center justify-center rounded-full border-2 border-neutral-700 bg-[#1f1f1f] hover:cursor-pointer shadow-md ${className}`}
      tabIndex={0}
      role="button"
    >
      {Children.map(children, (child) =>
        React.isValidElement(child)
          ? cloneElement(
              child as React.ReactElement<{ isHovered?: MotionValue<number> }>,
              {
                isHovered,
              },
            )
          : child,
      )}
    </motion.div>
  );
}

/* ---------- Dock Container ---------- */

export default function Dock({
  items,
  className = "",
  spring = { mass: 0.15, stiffness: 160, damping: 18 },
  magnification = 70,
  distance = 200,
  panelHeight = 64,
  baseItemSize = 50,
  position = "bottom",
  align = "center",
  bgClass = "bg-[#1f1f1f]",
  borderClass = "border-neutral-700",
  showLabels = true,
  expandOnHover = true,
}: DockProps) {
  const mouseX = useMotionValue(Infinity);
  const isHovered = useMotionValue(0);

  const expandedHeight = expandOnHover
    ? Math.max(panelHeight, magnification + 20)
    : panelHeight;

  const heightRow = useTransform(
    isHovered,
    [0, 1],
    [panelHeight, expandedHeight],
  );
  const height = useSpring(heightRow, spring);

  const handleMouseMove = useCallback(
    ({ pageX }: React.MouseEvent) => {
      isHovered.set(1);
      mouseX.set(pageX);
    },
    [isHovered, mouseX],
  );

  const handleMouseLeave = useCallback(() => {
    isHovered.set(0);
    mouseX.set(Infinity);
  }, [isHovered, mouseX]);

  const positionClasses = {
    bottom: "bottom-4",
    top: "top-4",
    left: "left-4",
    right: "right-4",
  };

  const alignClasses = {
    center: "left-1/2 -translate-x-1/2",
    start: "left-6",
    end: "right-6",
  };

  const posClass = positionClasses[position];
  const alignClass = alignClasses[align];

  return (
    <motion.div
      style={{ height }}
      className="flex items-center justify-center overflow-visible w-fit"
    >
      <motion.div
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className={`${className} fixed ${posClass} ${alignClass} flex items-end w-fit gap-4 rounded-2xl border-2 px-4 pb-2 ${bgClass} ${borderClass} z-50`}
        style={{ height: panelHeight }}
        role="toolbar"
      >
        {items.map((item, i) => (
          <DockItem
            key={`dock-item-${i}`}
            onClick={item.onClick}
            className={item.className}
            mouseX={mouseX}
            spring={spring}
            distance={distance}
            magnification={magnification}
            baseItemSize={baseItemSize}
          >
            <DockIcon>{item.icon}</DockIcon>
            {showLabels && <DockLabel>{item.label}</DockLabel>}
          </DockItem>
        ))}
      </motion.div>
    </motion.div>
  );
}
