import { useEffect, useState } from "react";

export function useResponsiveColumns() {
  const [cols, setCols] = useState(3);

  useEffect(() => {
    const updateCols = () => {
      const w = window.innerWidth;
      if (w > 1600) setCols(5);
      else if (w > 1200) setCols(4);
      else if (w > 800) setCols(3);
      else if (w > 500) setCols(2);
      else setCols(1);
    };

    updateCols();
    window.addEventListener("resize", updateCols);
    return () => window.removeEventListener("resize", updateCols);
  }, []);

  return cols;
}
