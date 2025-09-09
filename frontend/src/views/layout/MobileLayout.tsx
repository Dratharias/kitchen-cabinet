import Navbar from "../../components/navbar/Navbar";
import SearchBar from "../../components/navbar/SearchBar";
import { surfaceTheme } from "../../theme/colors";

export function MobileLayout(props) {
  return (
    <div class={`${surfaceTheme.Card} flex flex-col min-h-screen`}>
      {/* Contenu */}
      <main class="flex mx-auto pt-4">{props.children}</main>

      {/* Navbar en bas */}
      <div class="fixed bottom-0 left-0 right-0 z-50">
        <SearchBar />
        <Navbar />
      </div>
    </div>
  );
}