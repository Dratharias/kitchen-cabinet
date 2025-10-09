"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { PublicationsService } from "@/services/publications";
import { useIsMobile } from "@/hooks/useIsMobile";
import { useAuthStore } from "@/stores/authStore"; // on lit l'état auth
import type { Publication } from "@/types/publication";

const API_BASE =
  import.meta.env.VITE_API_URL ||
  `http://localhost:${import.meta.env.VITE_API_PORT}`;

export function usePublicationView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { isAuthenticated } = useAuthStore();

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

  /** Fetch principal : bascule public/privé */
  const fetchPublication = useCallback(async () => {
    if (!id) {
      navigate("/404", { replace: true });
      return;
    }
    setLoading(true);

    const call = isAuthenticated
      ? PublicationsService.getPrivatePublicationById
      : PublicationsService.getPublicPublicationById;

    try {
      const result = await call(id);
      if (!result) {
        navigate("/404", { replace: true });
        return;
      }
      setPublication(result as DynamicPublication);
    } catch (err) {
      // fallback public si token expiré / 401
      if (isAuthenticated) {
        try {
          const fallback = await PublicationsService.getPublicPublicationById(id);
          if (fallback) {
            setPublication(fallback as DynamicPublication);
            return;
          }
        } catch (e2) {
          console.error("Échec fallback public :", e2);
        }
      }
      console.error("Erreur lors du chargement :", err);
      navigate("/404", { replace: true });
    } finally {
      setLoading(false);
    }
  }, [id, navigate, isAuthenticated]);

  useEffect(() => {
    fetchPublication();
  }, [fetchPublication]);

  const toggleChecked = useCallback((key: string) => {
    setCheckedItems((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const expandFetcher = useCallback(async (subId: string) => {
    try {
      const token = localStorage.getItem("auth_token");
      const res = await fetch(`${API_BASE}/api/private/publications/${subId}`, {
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
