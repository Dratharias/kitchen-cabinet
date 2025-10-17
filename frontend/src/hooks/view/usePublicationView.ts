"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { PublicationsService } from "../../services/publications";
import { useAuthStore } from "../../stores/authStore";
import type { Publication, PublicationPayload } from "../../types";
import { OrchestratorService } from "../../services/orchestrator";
import toast from "react-hot-toast";
import { PayloadBuilder } from "../../services/payloadBuilder";

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
      return { action: "update", payload: { [id]: fields } };
    },
    [],
  );

  const buildStructuralPayload = useCallback(
    (action: "create" | "delete", resourceId: string, data?: any): any => {
      if (action === "delete") {
        return { action: "delete", payload: { [resourceId]: null } };
      }
      if (action === "create" && data) {
        return { action: "create", payload: { [resourceId]: data } };
      }
      return null;
    },
    [],
  );

  const executeMutation = useCallback(
    async (payload: any, successMessage: string) => {
      if (!isAuthenticated) {
        toast.error("Authentification requise.");
        return false;
      }
      if (!payload) {
        toast.error("Opération invalide.");
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

  const updatePublicationField = useCallback(
    async (fields: SimpleUpdatePayload) => {
      if (!publication?.publication_id) return false;
      const payload = buildMicroUpdatePayload(
        publication.publication_id,
        fields,
      );
      return executeMutation(payload, "Publication mise à jour !");
    },
    [publication?.publication_id, buildMicroUpdatePayload, executeMutation],
  );

  const updateContentField = useCallback(
    async (contentId: string, fields: SimpleUpdatePayload) => {
      const payload = buildMicroUpdatePayload(contentId, fields);
      return executeMutation(payload, "Contenu mis à jour !");
    },
    [buildMicroUpdatePayload, executeMutation],
  );

  const updateIngredientFields = useCallback(
    async (ingredientId: string, fields: any) => {
      const payload = buildMicroUpdatePayload(ingredientId, fields);
      return executeMutation(payload, "Ingrédient mis à jour !");
    },
    [buildMicroUpdatePayload, executeMutation],
  );

  const updateSegmentFields = useCallback(
    async (segmentId: string, fields: any) => {
      const payload = buildMicroUpdatePayload(segmentId, fields);
      return executeMutation(payload, "Étape mise à jour !");
    },
    [buildMicroUpdatePayload, executeMutation],
  );

  const addIngredient = useCallback(
    async (contentId: string, fields: any) => {
      const payload = buildStructuralPayload("create", contentId, fields);
      return executeMutation(payload, "Ingrédient ajouté.");
    },
    [buildStructuralPayload, executeMutation],
  );

  const deleteIngredient = useCallback(
    async (ingredientId: string) => {
      const payload = buildStructuralPayload("delete", ingredientId);
      return executeMutation(payload, "Ingrédient supprimé.");
    },
    [buildStructuralPayload, executeMutation],
  );

  const addSegment = useCallback(
    async (contentId: string, fields: any) => {
      const payload = buildStructuralPayload("create", contentId, fields);
      return executeMutation(payload, "Étape ajoutée.");
    },
    [buildStructuralPayload, executeMutation],
  );

  const deleteSegment = useCallback(
    async (segmentId: string) => {
      const payload = buildStructuralPayload("delete", segmentId);
      return executeMutation(payload, "Étape supprimée.");
    },
    [buildStructuralPayload, executeMutation],
  );

  const updatePublication = useCallback(
    async (publicationData: PublicationPayload) => {
      if (!publication?.publication_id) return false;

      const payloadBuilder = new PayloadBuilder();
      const payload = payloadBuilder.build(
        "update",
        publication.publication_id,
        publicationData,
        publication,
      );

      if (payload.payload[publication.publication_id]) {
        (
          payload.payload[publication.publication_id] as Publication
        ).publication_id = publication.publication_id;
      }

      return executeMutation(payload, "Publication mise à jour !");
    },
    [publication, executeMutation],
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
    updatePublication,
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
