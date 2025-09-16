import Navbar from "../../components/navbar/Navbar";
import SearchBar from "../../components/navbar/SearchBar";

export function MobileLayout(props) {
  return (
    <div class="flex flex-col min-h-screen w-full bg-layout dark:bg-layout-d">
      {/* Header sticky */}
      <div class="sticky top-0 z-50 flex min-h-18 min-w-full bg-layout dark:bg-layout-d">
      </div>

      {/* Contenu */}
      <main class="flex-1 w-full mx-auto p-2 pb-24 pt-2 bg-layout dark:bg-layout-d">
        {props.children}
      </main>

      {/* Navbar en bas */}
      <div class="fixed bottom-0 left-0 right-0 z-50 bg-layout dark:bg-layout-d">
        <SearchBar />
        <Navbar />
      </div>
    </div>
  );
}
