"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { PublicationsService } from "../../services/publications";
import { useAuthStore } from "../../stores/authStore";
import type { Publication, PublicationPayload } from "../../types";
import { OrchestratorService } from "../../services/orchestrator";
import toast from "react-hot-toast";
import { PayloadBuilder } from "../../services/payloadBuilder";

const publicationCache = new Map<string, Publication>();

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

  const forceReload = useCallback(() => {
    if (id) {
      publicationCache.delete(id);
    }
    setForceRefetch((prev) => prev + 1);
  }, [id]);

  const buildMicroUpdatePayload = useCallback(
    (resourceType: string, id: string, fields: SimpleUpdatePayload): any => {
      if (fields.description && typeof fields.description === "string") {
        fields.description = fields.description.split("\n");
      }
      return { action: "update", payload: { [resourceType]: { [id]: fields } } };
    },
    [],
  );

  const buildStructuralPayload = useCallback(
    (action: "create" | "delete", resourceType: string, resourceId: string, data?: any): any => {
      if (action === "delete") {
        return { action: "delete", payload: { [resourceType]: { [resourceId]: null } } };
      }
      if (action === "create" && data) {
        return { action: "create", payload: { [resourceType]: { [resourceId]: data } } };
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
        "publications",
        publication.publication_id,
        fields,
      );
      return executeMutation(payload, "Publication mise à jour !");
    },
    [publication?.publication_id, buildMicroUpdatePayload, executeMutation],
  );

  const updateContentField = useCallback(
    async (contentId: string, fields: SimpleUpdatePayload) => {
      const payload = buildMicroUpdatePayload("contents", contentId, fields);
      return executeMutation(payload, "Contenu mis à jour !");
    },
    [buildMicroUpdatePayload, executeMutation],
  );

  const updateIngredientFields = useCallback(
    async (ingredientId: string, fields: any) => {
      const payload = buildMicroUpdatePayload("ingredients", ingredientId, fields);
      return executeMutation(payload, "Ingrédient mis à jour !");
    },
    [buildMicroUpdatePayload, executeMutation],
  );

  const updateSegmentFields = useCallback(
    async (segmentId: string, fields: any) => {
      const payload = buildMicroUpdatePayload("segments", segmentId, fields);
      return executeMutation(payload, "Étape mise à jour !");
    },
    [buildMicroUpdatePayload, executeMutation],
  );

  const addIngredient = useCallback(
    async (contentId: string, fields: any) => {
      const payload = {
        action: "update",
        payload: {
          contents: {
            [contentId]: {
              content_ingredients: {
                connect: [fields],
              },
            },
          },
        },
      };
      return executeMutation(payload, "Ingrédient ajouté.");
    },
    [executeMutation],
  );

  const deleteIngredient = useCallback(
    async (ingredientId: string) => {
      const payload = buildStructuralPayload("delete", "ingredients", ingredientId);
      return executeMutation(payload, "Ingrédient supprimé.");
    },
    [buildStructuralPayload, executeMutation],
  );

  const addSegment = useCallback(
    async (contentId: string, fields: any) => {
       const payload = {
        action: "update",
        payload: {
          contents: {
            [contentId]: {
              content_segments: {
                connect: [{ segment: fields }],
              },
            },
          },
        },
      };
      return executeMutation(payload, "Étape ajoutée.");
    },
    [executeMutation],
  );

  const deleteSegment = useCallback(
    async (segmentId: string) => {
      const payload = buildStructuralPayload("delete", "segments", segmentId);
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
  
      if (payload.payload.publications[publication.publication_id]) {
        (payload.payload.publications[publication.publication_id] as Publication).publication_id = publication.publication_id;
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

    if (publicationCache.has(id)) {
      setPublication(publicationCache.get(id)!);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const result = await PublicationsService.getPublicationById(
        id,
        isAuthenticated,
      );
      if (result) {
        const pub = result as Publication;
        publicationCache.set(id, pub);
        setPublication(pub);
      } else {
        navigate("/404", { replace: true });
      }
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