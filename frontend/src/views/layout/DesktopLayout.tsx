import Navbar from "../../components/navbar/Navbar";
import SearchBar from "../../components/navbar/SearchBar";

export function DesktopLayout(props) {
  return (
    <div class="flex flex-col min-h-screen bg-mintsage-50 dark:bg-forest-400 text-forest-700 dark:text-harmony-100">
      {/* Navbar */}
      <div class="flex flex-col fixed top-0 left-0 right-0 z-40">
        <Navbar />
        <SearchBar />
      </div>

      {/* Contenu principal */}
      <main class="flex max-w-7xl mx-auto pt-28">
        {props.children}
      </main>
    </div>
  );
}
