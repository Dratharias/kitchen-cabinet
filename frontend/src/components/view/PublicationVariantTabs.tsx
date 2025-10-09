export function PublicationVariantTabs({ variants, selectedVariant, setSelectedVariant }: any) {
  if (variants.length <= 1) return null;
  return (
    <div className="flex flex-wrap gap-2 mb-6">
      {variants.map((v: any, i: number) => (
        <button
          key={i}
          onClick={() => setSelectedVariant(i)}
          className={`px-4 py-2 rounded-full text-sm hover:cursor-pointer ${
            i === selectedVariant
              ? "bg-amber-600 text-white"
              : "bg-gray-700 text-gray-300 hover:bg-gray-600"
          }`}
        >
          {v.subtitle || `Variante ${i + 1}`}
        </button>
      ))}
    </div>
  );
}
