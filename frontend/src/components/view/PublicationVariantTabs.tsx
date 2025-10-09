import AnimatedList from "../ui/AnimatedList";

export function PublicationVariantTabs({
  variants,
  selectedVariant,
  setSelectedVariant,
}: any) {
  if (variants.length <= 1) return null;

  return (
    <AnimatedList
      onItemSelect={(i) => setSelectedVariant(i)}
      initialSelectedIndex={selectedVariant}
    >
      {variants.map((v: any, i: number) => (
        <span key={i}>{v.subtitle || `Variante ${i + 1}`}</span>
      ))}
    </AnimatedList>
  );
}
