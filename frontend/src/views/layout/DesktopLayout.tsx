import Navbar from "@/components/navbar/Navbar";
import SearchBar from "@/components/navbar/SearchBar";

export function DesktopLayout(props) {
  return (
    <div class={`flex flex-col w-full min-h-screen bg-layout dark:bg-layout-d`}>
      {/* Navbar */}
      <div class="flex flex-col fixed top-0 left-0 right-0 z-40 bg-layout dark:bg-layout-d">
        <Navbar />
        <SearchBar />
      </div>

      {/* Contenu principal */}
      <main class="flex flex-col w-full max-w-[1400px] mx-auto pt-28 px-4 md:px-6 lg:px-8 bg-layout dark:bg-layout-d">
        {props.children}
      </main>
    </div>
  );
}