"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { PublicationsService } from "@/services/publications";
import { useIsMobile } from "@/hooks/useIsMobile";
import type { Publication } from "@/types/publication";

const API_BASE =
  import.meta.env.VITE_API_URL ||
  `http://localhost:${import.meta.env.VITE_API_PORT}`;

/**
 * Hook principal pour la vue Publication.
 * 100% compatible avec les anciens composants
 * (subtitle, content_ingredients, content_segments, etc.)
 */
export function usePublicationView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  // Types élargis pour supporter les champs dynamiques du backend
  type DynamicPublication = Publication & {
    contents?: Array<
      Record<string, any> & {
        is_ingredient?: boolean;
        subtitle?: string | null;
        content_ingredients?: any[];
        content_segments?: any[];
        content_prep_times?: any[];
      }
    >;
  };

  const [publication, setPublication] = useState<DynamicPublication | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [selectedVariant, setSelectedVariant] = useState(0);
  const [mobileTab, setMobileTab] = useState<"ingredients" | "steps">(
    "ingredients",
  );
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const [servingFactor, setServingFactor] = useState(1);

  /** Fetch principal : publication publique */
  const fetchPublication = useCallback(async () => {
    if (!id) {
      navigate("/404", { replace: true });
      return;
    }
    setLoading(true);
    try {
      const result = await PublicationsService.getPublicPublicationById(id);
      if (!result) {
        navigate("/404", { replace: true });
        return;
      }

      // Cast explicite vers notre type dynamique
      setPublication(result as DynamicPublication);
    } catch (err) {
      console.error("Erreur lors du chargement :", err);
      navigate("/404", { replace: true });
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    fetchPublication();
  }, [fetchPublication]);

  /** Gestion des cases cochées */
  const toggleChecked = useCallback((key: string) => {
    setCheckedItems((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  /** Chargement dynamique d’une sous-recette */
  const expandFetcher = useCallback(async (subId: string) => {
    try {
      const token = localStorage.getItem("auth_token");
      const res = await fetch(`${API_BASE}/api/publications/${subId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) return null;
      return (await res.json()) as DynamicPublication;
    } catch (e) {
      console.error("Erreur de chargement sous-recette :", e);
      return null;
    }
  }, []);

  return {
    publication,
    loading,
    isMobile,
    selectedVariant,
    setSelectedVariant,
    mobileTab,
    setMobileTab,
    checkedItems,
    toggleChecked,
    servingFactor,
    setServingFactor,
    expandFetcher,
  };
}
