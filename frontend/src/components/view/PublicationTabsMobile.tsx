export function PublicationTabsMobile({ mobileTab, setMobileTab }: any) {
  return (
    <div className="flex mb-6 border-b border-gray-700 bg-[#1F1F1F]/80">
      {["ingredients", "steps"].map((tab) => (
        <button
          key={tab}
          onClick={() => setMobileTab(tab as any)}
          className={`flex-1 py-2 text-sm font-semibold hover:cursor-pointer ${
            mobileTab === tab
              ? "text-amber-400 border-b-2 border-amber-400"
              : "text-gray-200 hover:text-white"
          }`}
        >
          {tab === "ingredients" ? "Ingrédients" : "Préparation"}
        </button>
      ))}
    </div>
  );
}
