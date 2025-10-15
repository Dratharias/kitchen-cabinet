"use client";

import { ReactNode } from "react";
import { DotGrid } from "@/components/ui/DotGrid";
import { Dock } from "@/components/ui/Dock";

interface AppLayoutProps {
  children: ReactNode;
  dockItems?: any[];
  searchButtonRef?: React.RefObject<HTMLDivElement>;
}

export function AppLayout({
  children,
  dockItems,
  searchButtonRef,
}: AppLayoutProps) {
  return (
    <DotGrid
      dotSize={10}
      gap={15}
      baseColor="#292929"
      activeColor="#5B4853"
      proximity={120}
      shockRadius={250}
      shockStrength={5}
      resistance={750}
      returnDuration={1.5}
      className="bg-[#1F1F1F] min-h-screen flex flex-col"
    >
      <main
        className="
          flex-1 mx-auto 
          w-full 
          max-w-full 
          sm:max-w-[640px] 
          md:max-w-[768px] 
          lg:max-w-[1024px] 
          xl:max-w-[1280px] 
          2xl:max-w-[1600px] 
          [@media(min-width:1920px)]:max-w-[1800px] 
          [@media(min-width:2560px)]:max-w-[2000px] 
          px-4 pt-4 md:px-6 lg:px-8 xl:px-10
        "
      >
        {children}
      </main>

      {dockItems && searchButtonRef && (
        <div
          ref={searchButtonRef}
          className="fixed bottom-0 left-1/2 -translate-x-1/2 z-50 h-26 w-110 backdrop-blur-md bg-black/10 p-4 rounded-lg"
        >
          <Dock
            panelHeight={40}
            items={dockItems}
            magnification={70}
            expandOnHover
            bgClass="bg-[#1f1f1f]"
            borderClass="border-neutral-700"
          />
        </div>
      )}
    </DotGrid>
  );
}
