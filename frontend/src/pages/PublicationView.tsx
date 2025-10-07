"use client";

import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  FileText,
  Utensils,
  ArrowLeft,
  Clock,
  Users,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { PublicationsService } from "@/services/publications";
import { useIsMobile } from "@/hooks/useIsMobile";

export function PublicationView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const [publication, setPublication] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [showIngredients, setShowIngredients] = useState(true);
  const [showSteps, setShowSteps] = useState(true);

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
    return (
      <div className="flex h-screen items-center justify-center text-gray-400">
        Chargement...
      </div>
    );

  if (!publication) return null;

  const firstContent = publication.contents?.[0];
  const ingredients = firstContent?.content_ingredients || [];
  const steps = firstContent?.content_segments || [];
  const totalTime = firstContent?.total_prep_time ?? 0;
  const servings = firstContent?.servings ?? 0;

  return (
    <div className="min-h-screen w-full p-6 bg-[#1F1F1F] text-gray-200">
      {/* --- HEADER --- */}
      <div className="flex items-center justify-between mb-8">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour
        </button>

        <div className="flex items-center gap-3">
          {publication.type && (
            <span className="px-3 py-1 text-xs rounded-full bg-amber-600 text-white uppercase tracking-wide">
              {publication.type.str_value}
            </span>
          )}
          {publication.style && (
            <span className="px-3 py-1 text-xs rounded-full bg-gray-700 text-gray-200">
              {publication.style.str_value}
            </span>
          )}
        </div>
      </div>

      {/* --- Titre --- */}
      <h1 className="text-4xl font-bold text-white mb-4">
        {publication.title}
      </h1>

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
      <ul className="space-y-1 text-gray-300 mb-4">
        {publication.description?.map((line: string, i: number) => (
          <li key={i}>• {line}</li>
        ))}
      </ul>

      {/* --- Stats --- */}
      <div className="flex justify-around text-center mb-8">
        <div>
          <Clock className="w-6 h-6 text-amber-500 mx-auto mb-1" />
          <p className="text-2xl font-semibold">{totalTime}</p>
          <p className="text-xs text-gray-400">minutes</p>
        </div>
        <div>
          <Users className="w-6 h-6 text-amber-500 mx-auto mb-1" />
          <p className="text-2xl font-semibold">{servings}</p>
          <p className="text-xs text-gray-400">portions</p>
        </div>
      </div>

      {/* --- INGREDIENTS --- */}
      <section className="border border-gray-800 rounded-lg p-4 mb-6">
        <header
          className="flex justify-between items-center cursor-pointer select-none"
          onClick={() => isMobile && setShowIngredients((p) => !p)}
        >
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <Utensils className="w-5 h-5" /> Ingrédients
          </h2>
          {isMobile &&
            (showIngredients ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            ))}
        </header>

        {(!isMobile || showIngredients) && (
          <ul className="mt-4 space-y-2 text-gray-300">
            {ingredients.map((ing) => (
              <li
                key={ing.ingredient_id}
                className="flex justify-between border-b border-gray-800 pb-1"
              >
                <span>
                  {ing.product.name}
                  {ing.ingredient_units?.length > 0 &&
                    ` (${ing.ingredient_units[0].name})`}
                </span>
                <span>{ing.quantity}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* --- ETAPES --- */}
      <section className="border border-gray-800 rounded-lg p-4 mb-12">
        <header
          className="flex justify-between items-center cursor-pointer select-none"
          onClick={() => isMobile && setShowSteps((p) => !p)}
        >
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <FileText className="w-5 h-5" /> Préparation
          </h2>
          {isMobile &&
            (showSteps ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            ))}
        </header>

        {(!isMobile || showSteps) && (
          <ol className="mt-4 list-decimal list-inside space-y-4 text-gray-300">
            {steps.map((s) => (
              <li key={s.segment.segment_id}>
                <p className="leading-relaxed">{s.segment.paragraph}</p>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}
