import Navbar from "@/components/navbar/Navbar";
import SearchBar from "@/components/navbar/SearchBar";

export function MobileLayout(props) {
  return (
    <div className="flex flex-col min-h-screen w-full">
      {/* Header sticky */}
      <div className="sticky top-0 z-50 flex min-h-18 min-w-full" />

      {/* Contenu */}
      <main className="flex-1 w-full mx-auto p-2 pb-24 pt-2">
        {props.children}
      </main>

      {/* Navbar en bas */}
      <div className="fixed bottom-0 left-0 right-0 z-50">
        <SearchBar />
        <Navbar />
      </div>
    </div>
  );
}
