"use client";

import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  FileText,
  Utensils,
  ArrowLeft,
  Clock,
  Users,
} from "lucide-react";
import { PublicationsService } from "@/services/publications";
import { useIsMobile } from "@/hooks/useIsMobile";
import { PrepTimeList } from "@/components/cards/PrepTimeList";

// --- Conversion décimales -> fractions pratiques ---
function toFraction(decimal: number): string {
  if (!decimal || isNaN(decimal)) return "";
  const tolerance = 0.15;
  const maxDenominator = 8;

  const commonFractions: [number, string][] = [
    [0.125, "1/8"], [0.25, "1/4"], [0.333, "1/3"],
    [0.375, "3/8"], [0.5, "1/2"], [0.625, "5/8"],
    [0.666, "2/3"], [0.75, "3/4"], [0.875, "7/8"]
  ];

  for (const [value, display] of commonFractions) {
    if (Math.abs(decimal - value) < tolerance) return display;
  }

  let [h1, h2] = [1, 0];
  let [k1, k2] = [0, 1];
  let b = decimal;

  for (let i = 0; i < 20; i++) {
    const a = Math.floor(b);
    let [h, k] = [a * h1 + h2, a * k1 + k2];
    if (k > maxDenominator) break;
    if (Math.abs(decimal - h / k) < tolerance && k <= maxDenominator) {
      return k === 1 ? h.toString() : `${h}/${k}`;
    }
    [h2, h1] = [h1, h];
    [k2, k1] = [k1, k];
    b = 1 / (b - a);
    if (!isFinite(b)) break;
  }

  if (decimal < 0.2) return "";
  if (decimal > 0.8) return "1";
  return "1/2";
}

// --- Format quantité ---
function formatQuantity(rawQty: number): string {
  if (!rawQty || rawQty <= 0) return "0";
  const intPart = Math.floor(rawQty);
  const decimalPart = rawQty - intPart;
  if (decimalPart < 0.1) return intPart > 0 ? intPart.toString() : "0";
  if (decimalPart > 0.9) return (intPart + 1).toString();
  const fraction = toFraction(decimalPart);
  if (intPart > 0 && fraction) return `${intPart} ${fraction}`;
  if (fraction) return fraction;
  return Math.round(rawQty).toString();
}

// --- Portion Control ---
function PortionControl({
  baseServings,
  servingFactor,
  setServingFactor,
}: {
  baseServings: number;
  servingFactor: number;
  setServingFactor: React.Dispatch<React.SetStateAction<number>>;
}) {
  return (
    <div className="flex gap-2 items-center">
      <button
        onClick={() => setServingFactor((f) => Math.max(1, f - 1))}
        className="px-2 py-1 bg-gray-700 rounded hover:cursor-pointer"
      >
        -
      </button>
      <span className="font-semibold">
        {Math.round(baseServings * servingFactor)} portions
      </span>
      <button
        onClick={() => setServingFactor((f) => f + 1)}
        className="px-2 py-1 bg-gray-700 rounded hover:cursor-pointer"
      >
        +
      </button>
    </div>
  );
}

export function PublicationView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const [publication, setPublication] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [servingFactor, setServingFactor] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState(0);

  useEffect(() => {
    if (!id) {
      navigate("/404", { replace: true });
      return;
    }
    (async () => {
      try {
        const result = await PublicationsService.getPublicPublicationById(id);
        if (!result) {
          navigate("/404", { replace: true });
          return;
        }
        setPublication(result);
      } catch (err: any) {
        console.error("Erreur de chargement :", err);
        navigate("/404", { replace: true });
      } finally {
        setLoading(false);
      }
    })();
  }, [id, navigate]);

  if (loading)
    return <div className="flex h-screen items-center justify-center text-gray-400">Chargement...</div>;
  if (!publication) return null;

  const contents = publication.contents || [];
  const ingredientBlocks = contents.filter((c: any) => c.is_ingredient);
  const variants = contents.filter((c: any) => !c.is_ingredient);

  const activeVariant = variants[selectedVariant] || null;

  return (
    <div className="min-h-screen h-full w-full p-6 bg-[#1F1F1F] text-gray-200">
      {/* --- HEADER --- */}
      <div className="flex items-center justify-between mb-8">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition hover:cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour
        </button>
      </div>

      {/* --- TITRE --- */}
      <h1 className="text-4xl font-bold text-white mb-4">{publication.title}</h1>

      {/* --- Image --- */}
      {publication.thumbnail ? (
        <img
          src={publication.thumbnail}
          alt={publication.title}
          className="w-full h-64 object-cover rounded-xl mb-6"
          loading="lazy"
        />
      ) : (
        <div className="w-full h-64 bg-gray-800 rounded-xl flex items-center justify-center text-gray-500 mb-6">
          Aucun visuel
        </div>
      )}

      {/* --- Description --- */}
      {publication.description?.length > 0 && (
        <ul className="space-y-1 text-gray-300 mb-8">
          {publication.description.map((line: string, i: number) => (
            <li key={i}>{line}</li>
          ))}
        </ul>
      )}

      {/* --- Ingrédients fixes --- */}
      {ingredientBlocks.map((block: any, idx: number) => {
        const ingredients = block?.content_ingredients || [];
        return (
          <div
            key={`ingredient-block-${idx}`}
            className="border border-gray-800 rounded-xl mb-10 overflow-hidden"
          >
            <header className="bg-[#2a2a2a] px-4 py-3">
              <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                <Utensils className="w-5 h-5 text-amber-500" />
                {block.subtitle || "Ingrédients"}
              </h2>
            </header>
            <div className="p-4">
              <ul className="space-y-2 text-gray-300">
                {ingredients.map((ing: any, i: number) => {
                  const rawQty =
                    (ing.quantity ?? 1) *
                    servingFactor *
                    (ing.multiply_factor ?? 1);
                  const displayQty = formatQuantity(rawQty);
                  return (
                    <li
                      key={`${ing.product?.name || "ing"}-${i}`}
                      className="flex justify-between border-b border-gray-800 pb-1"
                    >
                      <span>
                        {ing.product?.name}
                        {ing.cut && <span className="text-gray-500"> ({ing.cut})</span>}
                        {ing.ingredient_units?.length > 0 &&
                          ` (${ing.ingredient_units[0].name})`}
                      </span>
                      <span>{displayQty}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        );
      })}

      {/* --- Sélecteur de variantes (onglets) --- */}
      {variants.length > 1 && (
        <div className="flex gap-2 mb-6 flex-wrap">
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
      )}

      {/* --- Variante sélectionnée --- */}
      {activeVariant && (
        <div className="border border-gray-800 rounded-xl mb-10 overflow-hidden">
          <header className="bg-[#2a2a2a] px-4 py-3 flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                <Utensils className="w-5 h-5 text-amber-500" />
                {activeVariant.subtitle || `Variante ${selectedVariant + 1}`}
              </h2>
              <div className="flex gap-4 mt-1 text-sm text-gray-400">
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4 text-amber-400" />
                  {activeVariant.total_prep_time ?? 0} min
                </span>
                {activeVariant.servings > 0 && (
                  <span className="flex items-center gap-1">
                    <Users className="w-4 h-4 text-amber-400" />
                    {Math.round((activeVariant.servings || 1) * servingFactor)} portions
                  </span>
                )}
              </div>
            </div>
            <PortionControl
              baseServings={activeVariant.servings || 1}
              servingFactor={servingFactor}
              setServingFactor={setServingFactor}
            />
          </header>

          <div className="p-4">
            {/* Ingrédients de la variante */}
            {activeVariant.content_ingredients?.length > 0 && (
              <section className="mb-6">
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                  <Utensils className="w-5 h-5 text-amber-500" />
                  Ingrédients
                </h3>
                <ul className="space-y-2 text-gray-300">
                  {activeVariant.content_ingredients.map((ing: any, i: number) => {
                    const rawQty =
                      (ing.quantity ?? 1) *
                      servingFactor *
                      (ing.multiply_factor ?? 1);
                    const displayQty = formatQuantity(rawQty);
                    return (
                      <li
                        key={`${ing.product?.name || "ing"}-${i}`}
                        className="flex justify-between border-b border-gray-800 pb-1"
                      >
                        <span>
                          {ing.product?.name}
                          {ing.cut && <span className="text-gray-500"> ({ing.cut})</span>}
                          {ing.ingredient_units?.length > 0 &&
                            ` (${ing.ingredient_units[0].name})`}
                        </span>
                        <span>{displayQty}</span>
                      </li>
                    );
                  })}
                </ul>
              </section>
            )}

            {/* Temps de préparation */}
            <section className="mb-6">
              <PrepTimeList prepTimes={activeVariant.content_prep_times || []} />
            </section>

            {/* Étapes */}
            <section>
              <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                <FileText className="w-5 h-5 text-amber-500" />
                Préparation
              </h3>
              <ol className="list-decimal list-inside space-y-3 text-gray-300">
                {activeVariant.content_segments?.map((s: any, j: number) => (
                  <li key={j} className="flex">
                    {s.title && (
                      <p className="font-semibold text-amber-400 mr-2">{s.title}</p>
                    )}
                    <p>{s.paragraph}</p>
                  </li>
                ))}
              </ol>
            </section>
          </div>
        </div>
      )}
    </div>
  );
}
