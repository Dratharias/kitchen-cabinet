'use client';

import {
  motion,
  MotionValue,
  useMotionValue,
  useSpring,
  useTransform,
  type SpringOptions,
  AnimatePresence,
} from 'motion/react';
import React, { Children, cloneElement, useEffect, useMemo, useRef, useState } from 'react';

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

  position?: 'bottom' | 'top' | 'left' | 'right';
  align?: 'center' | 'start' | 'end';
  bgClass?: string;
  borderClass?: string;
  showLabels?: boolean;
  expandOnHover?: boolean; // <-- nouvelle option
};

type DockItemProps = {
  className?: string;
  children: React.ReactNode;
  onClick?: () => void;
  mouseX: MotionValue<number>;
  spring: SpringOptions;
  distance: number;
  baseItemSize: number;
  magnification: number;
};

function DockItem({
  children,
  className = '',
  onClick,
  mouseX,
  spring,
  distance,
  magnification,
  baseItemSize,
}: DockItemProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isHovered = useMotionValue(0);

  const mouseDistance = useTransform(mouseX, (val) => {
    const rect = ref.current?.getBoundingClientRect() ?? { x: 0, width: baseItemSize };
    return val - rect.x - baseItemSize / 2;
  });

  const targetSize = useTransform(mouseDistance, [-distance, 0, distance], [baseItemSize, magnification, baseItemSize]);
  const size = useSpring(targetSize, spring);

  return (
    <motion.div
      ref={ref}
      style={{ width: size, height: size }}
      onHoverStart={() => isHovered.set(1)}
      onHoverEnd={() => isHovered.set(0)}
      onClick={onClick}
      className={`relative inline-flex items-center justify-center rounded-full border-2 border-neutral-700 bg-[#1f1f1f] hover:cursor-pointer shadow-md ${className}`}
      tabIndex={0}
      role="button"
    >
      {Children.map(children, (child) =>
        React.isValidElement(child)
          ? cloneElement(child as React.ReactElement<{ isHovered?: MotionValue<number> }>, { isHovered })
          : child,
      )}
    </motion.div>
  );
}

function DockLabel({
  children,
  isHovered,
}: {
  children: React.ReactNode;
  isHovered?: MotionValue<number>;
}) {
  const [isVisible, setIsVisible] = useState(false);
  useEffect(() => {
    if (!isHovered) return;
    const unsub = isHovered.on('change', (latest) => setIsVisible(latest === 1));
    return () => unsub();
  }, [isHovered]);

  return (
    <AnimatePresence>
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

function DockIcon({ children }: { children: React.ReactNode }) {
  return <div className="flex items-center justify-center">{children}</div>;
}

export default function Dock({
  items,
  className = '',
  spring = { mass: 0.15, stiffness: 160, damping: 18 },
  magnification = 70,
  distance = 200,
  panelHeight = 64,
  baseItemSize = 50,
  position = 'bottom',
  align = 'center',
  bgClass = 'bg-[#1f1f1f]',
  borderClass = 'border-neutral-700',
  showLabels = true,
  expandOnHover = true,
}: DockProps) {
  const mouseX = useMotionValue(Infinity);
  const isHovered = useMotionValue(0);

  const expandedHeight = useMemo(
    () => (expandOnHover ? Math.max(panelHeight, magnification + 20) : panelHeight),
    [expandOnHover, panelHeight, magnification]
  );

  const heightRow = useTransform(isHovered, [0, 1], [panelHeight, expandedHeight]);
  const height = useSpring(heightRow, spring);

  const posClass =
    position === 'bottom'
      ? 'bottom-4'
      : position === 'top'
      ? 'top-4'
      : position === 'left'
      ? 'left-4'
      : 'right-4';
  const alignClass =
    align === 'center'
      ? 'left-1/2 -translate-x-1/2'
      : align === 'start'
      ? 'left-6'
      : 'right-6';

  return (
    <motion.div style={{ height }} className="flex items-center justify-center overflow-visible w-fit">
      <motion.div
        onMouseMove={({ pageX }) => {
          isHovered.set(1);
          mouseX.set(pageX);
        }}
        onMouseLeave={() => {
          isHovered.set(0);
          mouseX.set(Infinity);
        }}
        className={`${className} fixed ${posClass} ${alignClass} flex items-end w-fit gap-4 rounded-2xl border-2 px-4 pb-2 ${bgClass} ${borderClass} z-50`}
        style={{ height: panelHeight }}
        role="toolbar"
      >
        {items.map((item, index) => (
          <DockItem
            key={index}
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
