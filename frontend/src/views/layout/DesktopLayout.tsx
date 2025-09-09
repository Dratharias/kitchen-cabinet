import Navbar from "../../components/navbar/Navbar";
import SearchBar from "../../components/navbar/SearchBar";

export function DesktopLayout(props) {
  return (
    <div class="flex flex-col w-full min-h-screen bg-mintsage-50 dark:bg-forest-400 text-forest-700 dark:text-harmony-100">
      {/* Navbar */}
      <div class="flex flex-col fixed top-0 left-0 right-0 z-40">
        <Navbar />
        <SearchBar />
      </div>

      {/* Contenu principal */}
      <main class="flex w-full mx-auto pt-28 md:max-w-2xl lg:max-w-4xl xl:max-w-6xl 2xl:max-w-7xl">
        {props.children}
      </main>
    </div>
  );
}
