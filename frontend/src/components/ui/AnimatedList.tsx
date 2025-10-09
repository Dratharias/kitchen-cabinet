import React, { useState, ReactNode } from "react";
import { motion, AnimatePresence } from "motion/react";
import ClickOutsideContainer from "../utilities/ClickOutsideContainer";

interface AnimatedListProps {
  children: ReactNode[];
  onItemSelect?: (index: number) => void;
  initialSelectedIndex?: number;
  className?: string;
}

const AnimatedList: React.FC<AnimatedListProps> = ({
  children,
  onItemSelect,
  initialSelectedIndex = 0,
  className = "",
}) => {
  const [selectedIndex, setSelectedIndex] = useState(initialSelectedIndex);
  const [open, setOpen] = useState(false);

  const handleSelect = (index: number) => {
    setSelectedIndex(index);
    onItemSelect?.(index);
    setOpen(false);
  };

  const items = React.Children.toArray(children);

  return (
    <div className={`relative inline-block ${className}`}>
        {/* Bouton principal */}
        <ClickOutsideContainer onClickOutside={() => handleSelect(selectedIndex)}>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="px-4 py-2 rounded-full text-sm bg-gray-700 text-gray-300 hover:bg-gray-600 hover:cursor-pointer"
        >
          <span>{items[selectedIndex]}</span> 
          <span className="pl-3">({items.length})</span>
        </button>

        {/* Liste déroulante animée */}
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute mt-2 w-max min-w-full bg-[#1f1f1f] border border-gray-700 rounded-lg shadow-lg z-50"
            >
              <ul className="flex flex-col">
                {items.map((child, i) => (
                  <li key={i}>
                    <button
                      type="button"
                      onClick={() => handleSelect(i)}
                      className={`w-full text-left px-4 py-2 text-sm rounded-md hover:cursor-pointer ${
                        i === selectedIndex
                          ? "bg-amber-600 text-white"
                          : "text-gray-300 hover:bg-gray-700"
                      }`}
                    >
                      {child}
                    </button>
                  </li>
                ))}
              </ul>
            </motion.div>
          )}
        </AnimatePresence>
    </ClickOutsideContainer>
      </div>
  );
};

export default AnimatedList;
