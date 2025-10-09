import { Variants, Transition } from "framer-motion";

/**
 * Animation de fade + slide gauche/droite
 */
export const fadeSlideVariants: Variants = {
  initial: { opacity: 0, x: 60, y: 20, scale: 0.98 },
  animate: { opacity: 1, x: 0, y: 0, scale: 1 },
  exit: { opacity: 0, x: 80, y: 40, scale: 0.96 },
};

/**
 * Animation progressive type “wave” (ligne par ligne, gauche → droite)
 */
export const fadeSlideTransition = (
  index: number,
  cols = 3,
  baseDelay = 0.03,
): Transition => {
  const row = Math.floor(index / cols);
  const col = index % cols;
  const waveDelay = row * 0.08 + col * baseDelay;
  return {
    type: "spring",
    stiffness: 420,
    damping: 32,
    mass: 0.6,
    delay: waveDelay,
  };
};
