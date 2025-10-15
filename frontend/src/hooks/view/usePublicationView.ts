"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { PublicationsService } from "@/services/publications";
import { useAuthStore } from "@/stores/authStore";
import type { Publication } from "@/types/publication";

const API_BASE =
  import.meta.env.VITE_API_URL ||
  `http://localhost:${import.meta.env.VITE_API_PORT}`;

export function usePublicationView() {
  const { id } = useParams();
  const navigate = useNavigate();
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

  // états toujours définis
  const [publication, setPublication] = useState<DynamicPublication | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedVariant, setSelectedVariant] = useState(0);
  const [mobileTab, setMobileTab] = useState<"ingredients" | "steps">("ingredients");
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const [servingFactor, setServingFactor] = useState(1);

  /** Fetch principal, toujours défini */
  const fetchPublication = useCallback(async () => {
    if (!id) {
      navigate("/404", { replace: true });
      return;
    }

    setLoading(true);
    const getFn = isAuthenticated
      ? PublicationsService.getPrivatePublicationById
      : PublicationsService.getPublicPublicationById;

    try {
      const result = await getFn(id);
      if (result) {
        setPublication(result as DynamicPublication);
        return;
      }

      // pas de résultat → fallback 404
      navigate("/404", { replace: true });
    } catch (err) {
      // fallback public si token expiré
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
      console.error("Erreur de chargement :", err);
      navigate("/404", { replace: true });
    } finally {
      setLoading(false);
    }
  }, [id, navigate, isAuthenticated]);

  /** exécuter une seule fois le fetch */
  useEffect(() => {
    fetchPublication();
  }, [fetchPublication]);

  /** gestion de cases cochées */
  const toggleChecked = useCallback((key: string) => {
    setCheckedItems((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  /** fetch pour sous-recettes, toujours stable */
  const expandFetcher = useCallback(async (subId: string) => {
    try {
      const token = localStorage.getItem("auth_token");
      const res = await fetch(`${API_BASE}/api/private/publications/${subId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) return null;
      const data = (await res.json()) as DynamicPublication;
      return data;
    } catch (e) {
      console.error("Erreur de chargement sous-recette :", e);
      return null;
    }
  }, []);

  // hook toujours ordonné, retour constant
  return {
    publication,
    loading,
    selectedVariant,
    setSelectedVariant,
    mobileTab,
    setMobileTab,
    checkedItems,
    toggleChecked,
    servingFactor,
    setServingFactor,
    expandFetcher,
    isAuthenticated,
  };
}
