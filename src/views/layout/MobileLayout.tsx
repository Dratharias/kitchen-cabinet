import Navbar from "../../components/navbar/Navbar";
import SearchBar from "../../components/navbar/SearchBar";

export function MobileLayout(props) {
  return (
    <div class="flex flex-col min-h-screen bg-mintsage-50 dark:bg-forest-400 text-forest-700 dark:text-harmony-100">
      {/* Contenu */}
      <main class="flex mx-auto">{props.children}</main>

      {/* Navbar en bas */}
      <div class="fixed bottom-0 left-0 right-0 z-50">
        <SearchBar />
        <Navbar />
      </div>
    </div>
  );
}