"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { PublicationsService } from "@/services/publications";
import { useAuthStore } from "@/stores/authStore";
import type { Publication, MacroPayload, PrepTimePayload } from "@/types";
import { OrchestratorService } from "@/services/orchestrator";
import toast from "react-hot-toast";

// Helper Type for inline updates: { fieldName: newValue }
type SimpleUpdatePayload = {
  [key: string]: any;
};

export function usePublicationView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();

  const [publication, setPublication] = useState<Publication | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedVariant, setSelectedVariant] = useState(0);
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const [forceRefetch, setForceRefetch] = useState(0);

  const forceReload = useCallback(
    () => setForceRefetch((prev) => prev + 1),
    [],
  );

  const buildMicroUpdatePayload = useCallback(
    (id: string, fields: SimpleUpdatePayload): any => {
      if (fields.description && typeof fields.description === "string") {
        fields.description = fields.description.split("\n");
      }

      return {
        action: "update",
        payload: {
          [id]: fields,
        },
      };
    },
    [],
  );

  const executeUpdate = useCallback(
    async (id: string, fields: SimpleUpdatePayload) => {
      if (!isAuthenticated) {
        toast.error("Authentification requise pour modifier.");
        return false;
      }

      const payload = buildMicroUpdatePayload(id, fields);

      try {
        await toast.promise(OrchestratorService.patch(payload), {
          loading: "Mise à jour...",
          success: "Mise à jour réussie!",
          error: "Échec de la mise à jour.",
        });
        forceReload();
        return true;
      } catch (error) {
        console.error("Échec de la mise à jour orchestrée:", error);
        return false;
      }
    },
    [isAuthenticated, buildMicroUpdatePayload, forceReload],
  );

  const updatePublicationField = useCallback(
    async (fields: SimpleUpdatePayload) => {
      if (!publication?.publication_id) return false;
      return executeUpdate(publication.publication_id, fields);
    },
    [publication?.publication_id, executeUpdate],
  );

  const updateContentField = useCallback(
    async (contentId: string, fields: SimpleUpdatePayload) => {
      if (fields.servings && typeof fields.servings === "string") {
        const match = fields.servings.match(/(\d+)\s*(.*)/) || [];
        const yieldValue = parseInt(match[1], 10) || 1;
        const unitValue =
          match[2].trim() || (yieldValue > 1 ? "portions" : "portion");

        fields.servings = { yield: yieldValue, value: unitValue };
      }

      return executeUpdate(contentId, fields);
    },
    [executeUpdate],
  );

  const updateIngredientFields = useCallback(
    async (
      ingredientId: string,
      fields: {
        quantity: number;
        unit: string;
        product: string;
        title: string;
        cut: string;
        multiply_factor: number;
        macro: MacroPayload | null;
      },
    ) => {
      const payload = {
        quantity: Number(fields.quantity),
        title: fields.title || null,
        cut: fields.cut || null,
        multiply_factor: Number(fields.multiply_factor) || 1,
        product: {
          name: fields.product,
          macro: fields.macro,
        },
        ingredient_units: [{ unit: { name: fields.unit } }],
      };
      return executeUpdate(ingredientId, payload);
    },
    [executeUpdate],
  );

  const updateSegmentFields = useCallback(
    async (
      segmentId: string,
      fields: {
        title: string;
        paragraph: string;
        segment_prep_time: PrepTimePayload[];
      },
    ) => {
      const payload = {
        title: fields.title,
        paragraph: fields.paragraph,
        segment_prep_time: fields.segment_prep_time.map((pt) => ({
          prep_time: pt,
        })),
      };
      return executeUpdate(segmentId, payload);
    },
    [executeUpdate],
  );

  const buildStructuralPayload = useCallback(
    (
      action: "create" | "delete",
      resourceId: string,
      resourceType: "ingredient" | "segment",
    ): any => {
      if (action === "delete") {
        return { action: "delete", payload: { [resourceId]: null } };
      }

      let newItem: any;
      if (resourceType === "ingredient") {
        newItem = {
          quantity: 1,
          multiply_factor: 1,
          product: { name: "Nouvel ingrédient" },
          ingredient_units: [{ unit: { name: "unité" } }],
        };
      } else if (resourceType === "segment") {
        newItem = {
          title: "Nouvelle étape",
          paragraph: "Description de l'étape",
        };
      }

      return {
        action: "create",
        payload: { [resourceId]: newItem },
      };
    },
    [],
  );

  const executeMutation = useCallback(
    async (payload: any, successMessage: string) => {
      if (!isAuthenticated) {
        toast.error("Authentification requise pour la mutation.");
        return false;
      }

      try {
        const response = await toast.promise(
          OrchestratorService.send(payload),
          {
            loading: "Opération en cours...",
            success: successMessage,
            error: (err) => `Échec: ${err.message || "Erreur interne"}`,
          },
        );
        forceReload();
        return response.success ?? false;
      } catch (error) {
        console.error("Échec de la mutation orchestrée:", error);
        return false;
      }
    },
    [isAuthenticated, forceReload],
  );

  const addIngredient = useCallback(
    async (contentId: string) => {
      const payload = buildStructuralPayload("create", contentId, "ingredient");
      return executeMutation(payload, "Ingrédient ajouté.");
    },
    [buildStructuralPayload, executeMutation],
  );

  const deleteIngredient = useCallback(
    async (ingredientId: string) => {
      const payload = buildStructuralPayload(
        "delete",
        ingredientId,
        "ingredient",
      );
      return executeMutation(payload, "Ingrédient supprimé.");
    },
    [buildStructuralPayload, executeMutation],
  );

  const addSegment = useCallback(
    async (contentId: string) => {
      const payload = buildStructuralPayload("create", contentId, "segment");
      return executeMutation(payload, "Segment ajouté.");
    },
    [buildStructuralPayload, executeMutation],
  );

  const deleteSegment = useCallback(
    async (segmentId: string) => {
      const payload = buildStructuralPayload("delete", segmentId, "segment");
      return executeMutation(payload, "Segment supprimé.");
    },
    [buildStructuralPayload, executeMutation],
  );

  const fetchPublication = useCallback(async () => {
    if (!id) {
      navigate("/404", { replace: true });
      return;
    }
    setLoading(true);
    try {
      const result = await PublicationsService.getPublicationById(
        id,
        isAuthenticated,
      );
      if (result) {
        setPublication(result as Publication);
        return;
      }
      navigate("/404", { replace: true });
    } catch (err) {
      console.error("Erreur de chargement :", err);
      navigate("/404", { replace: true });
    } finally {
      setLoading(false);
    }
  }, [id, navigate, isAuthenticated]);

  useEffect(() => {
    fetchPublication();
  }, [fetchPublication, forceRefetch]);

  const toggleChecked = useCallback((key: string) => {
    setCheckedItems((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  return {
    publication,
    loading,
    selectedVariant,
    setSelectedVariant,
    checkedItems,
    toggleChecked,
    isAuthenticated,
    updatePublicationField,
    updateContentField,
    updateIngredientFields,
    updateSegmentFields,
    addIngredient,
    deleteIngredient,
    addSegment,
    deleteSegment,
  };
}
