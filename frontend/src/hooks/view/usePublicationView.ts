"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { PublicationsService } from "../../services/publications";
import { useAuthStore } from "../../stores/authStore";
import type {
  Publication,
  PublicationPayload,
  OrchestratorPayload,
} from "../../types";
import { OrchestratorService } from "../../services/orchestrator";
import toast from "react-hot-toast";

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
      return {
        action: "update",
        payload: { [resourceType]: { [id]: fields } },
      };
    },
    [],
  );

  const buildStructuralPayload = useCallback(
    (
      action: "create" | "delete",
      resourceType: string,
      resourceId: string,
      data?: any,
    ): any => {
      if (action === "delete") {
        return {
          action: "delete",
          payload: { [resourceType]: { [resourceId]: null } },
        };
      }
      if (action === "create" && data) {
        return {
          action: "create",
          payload: { [resourceType]: { [`new_${Date.now()}`]: data } },
        };
      }
      return null;
    },
    [],
  );

  const executeMutation = useCallback(
    async (payload: any, successMessage: string) => {
      if (!isAuthenticated) {
        toast.error("Authentification requise.");
        return null;
      }
      if (!payload) {
        toast.error("Opération invalide.");
        return null;
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
        if (response.success) {
          forceReload();
          return response.results;
        }
        return null;
      } catch (error) {
        console.error("Échec de la mutation orchestrée:", error);
        return null;
      }
    },
    [isAuthenticated, forceReload],
  );

  const updatePublicationField = useCallback(
    async (fields: SimpleUpdatePayload) => {
      if (!publication?.publication_id) return null;
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
      const results = await executeMutation(payload, "Contenu mis à jour !");
      return results?.[contentId] || null;
    },
    [buildMicroUpdatePayload, executeMutation],
  );

  const updateIngredientFields = useCallback(
    async (ingredientId: string, fields: any) => {
      const payload = buildMicroUpdatePayload(
        "ingredients",
        ingredientId,
        fields,
      );
      const results = await executeMutation(payload, "Ingrédient mis à jour !");
      return results?.[ingredientId] || null;
    },
    [buildMicroUpdatePayload, executeMutation],
  );

  const updateSegmentFields = useCallback(
    async (segmentId: string, fields: any) => {
      const payload = buildMicroUpdatePayload("segments", segmentId, fields);
      const results = await executeMutation(payload, "Étape mise à jour !");
      return results?.[segmentId] || null;
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
      const payload = buildStructuralPayload(
        "delete",
        "ingredients",
        ingredientId,
      );
      const results = await executeMutation(payload, "Ingrédient supprimé.");
      return results?.[ingredientId]?.deleted || false;
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
      const results = await executeMutation(payload, "Étape supprimée.");
      return results?.[segmentId]?.deleted || false;
    },
    [buildStructuralPayload, executeMutation],
  );

  const updatePublication = useCallback(
    async (formData: any) => {
      if (!publication?.publication_id) return false;

      // Construire manuellement le payload pour garantir l'intégrité des données
      let publicationPayload: PublicationPayload = {
        ...formData,
        publication_id: publication.publication_id,
        description: Array.isArray(formData.description)
          ? formData.description
          : formData.description.split("\n"),
        note: Array.isArray(formData.note)
          ? formData.note
          : formData.note.split("\n"),
      };

      // Transform segments from flat to nested format for backend
      // Frontend format: { position: 1, title, paragraph, note }
      // Backend format: { position: 1, segment: { title, paragraph, note } }
      if (publicationPayload.contents) {
        publicationPayload.contents = publicationPayload.contents.map((content: any) => {
          if (content.segments) {
            return {
              ...content,
              segments: content.segments.map((seg: any) => ({
                position: seg.position,
                segment: {
                  title: seg.title,
                  paragraph: seg.paragraph,
                  note: seg.note,
                },
              })),
            };
          }
          return content;
        });
      }

      const orchestratorPayload: OrchestratorPayload = {
        action: "update",
        payload: {
          [publication.publication_id]: publicationPayload,
        },
      };

      const results = await executeMutation(
        orchestratorPayload,
        "Publication mise à jour !",
      );
      return !!results;
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

  const setLocalPublication = (
    updater: (prev: Publication | null) => Publication | null,
  ) => {
    setPublication(updater);
  };

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
    setLocalPublication,
  };
}
