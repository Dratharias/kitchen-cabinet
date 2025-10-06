import { useEffect, useRef, ReactNode, CSSProperties } from "react";

type ClickOutsideContainerProps = {
  children: ReactNode;
  onClickOutside: () => void;
  className?: string;
  style?: CSSProperties;
};

const ClickOutsideContainer = ({
  children,
  onClickOutside,
  className,
  style,
}: ClickOutsideContainerProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      const el = containerRef.current;
      if (el && !el.contains(event.target as Node)) {
        onClickOutside();
      }
    };

    document.addEventListener("pointerdown", handleClick);
    return () => {
      document.removeEventListener("pointerdown", handleClick);
    };
  }, [onClickOutside]);

  return (
    <div ref={containerRef} className={className} style={style}>
      {children}
    </div>
  );
};

export default ClickOutsideContainer;
