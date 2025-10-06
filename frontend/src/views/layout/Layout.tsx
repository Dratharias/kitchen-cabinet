import { useState, useEffect, ReactNode } from "react";
import { DesktopLayout } from "./DesktopLayout";
import { MobileLayout } from "./MobileLayout";
import { NavProvider } from "../../components/navbar/NavContext";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" && window.matchMedia("(max-width: 767px)").matches
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 767px)");
    const handleChange = (e: MediaQueryListEvent) => setIsMobile(e.matches);

    mediaQuery.addEventListener("change", handleChange);
    setIsMobile(mediaQuery.matches);

    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  return (
    <NavProvider>
      {isMobile ? (
        <MobileLayout>{children}</MobileLayout>
      ) : (
        <DesktopLayout>{children}</DesktopLayout>
      )}
    </NavProvider>
  );
}
