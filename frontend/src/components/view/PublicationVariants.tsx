export function PublicationVariants({
  variants,
  selectedVariant,
  setSelectedVariant,
}: any) {
  if (variants.length <= 1) return null;
  return (
    <div className="flex gap-2 mb-8 flex-wrap ">
      {variants.map((v: any, i: number) => (
        <button
          key={i}
          onClick={() => setSelectedVariant(i)}
          className={`px-3 py-1 rounded-full text-sm hover:cursor-pointer ${
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
