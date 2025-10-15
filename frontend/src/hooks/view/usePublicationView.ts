"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { PublicationsService } from "@/services/publications";
import { useAuthStore } from "@/stores/authStore";
import type { Publication } from "@/types/publication";
import { OrchestratorService } from "@/services/orchestrator";
import toast from "react-hot-toast";

// Helper Type for inline updates: { fieldName: newValue }
type SimpleUpdatePayload = {
    [key: string]: any;
};

// Helper pour reconstruire la structure de l'unité depuis les données du hook
const buildUnitPayload = (unit: any) => ({
    unit: {
        unit_id: unit?.unit_id,
        name: unit?.name || "unité"
    }
});

export function usePublicationView() {
  const { id } = useParams<{ id: string }>(); 
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  
  // Canonical state for the entire Publication object
  const [publication, setPublication] = useState<Publication | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedVariant, setSelectedVariant] = useState(0);
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const [forceRefetch, setForceRefetch] = useState(0); 

  const forceReload = useCallback(() => setForceRefetch(prev => prev + 1), []);

  /**
   * Constructs the Orchestrator payload for micro-updates.
   */
  const buildMicroUpdatePayload = useCallback((id: string, fields: SimpleUpdatePayload): any => {
    if (fields.description && typeof fields.description === 'string') {
        fields.description = fields.description.split('\n');
    }
    
    // The Orchestrator expects the resource ID as the top-level payload key.
    return {
        action: "update",
        payload: {
            [id]: fields
        }
    };
  }, []);

  /**
   * Centralized API call wrapper for PATCHing micro-updates via the Orchestrator.
   */
  const executeUpdate = useCallback(async (id: string, fields: SimpleUpdatePayload) => {
    if (!isAuthenticated) {
        toast.error("Authentification requise pour modifier.");
        return false;
    }
    
    const payload = buildMicroUpdatePayload(id, fields);
    
    try {
        await toast.promise(
            OrchestratorService.patch(payload),
            {
                loading: 'Mise à jour...',
                success: 'Mise à jour réussie!',
                error: 'Échec de la mise à jour.'
            }
        );
        forceReload();
        return true;
    } catch (error) {
        console.error("Échec de la mise à jour orchestrée:", error);
        return false;
    }
  }, [isAuthenticated, buildMicroUpdatePayload, forceReload]);


  // --- 1. Update Handlers (Reconstruction Complète) ---

  /**
   * PUBLIC API: Update a direct publication field (e.g., title, description).
   */
  const updatePublicationField = useCallback(async (fields: SimpleUpdatePayload) => {
    if (!publication?.publication_id) return false;
    // Publication update is simple: executeUpdate with the publication ID
    return executeUpdate(publication.publication_id, fields);
  }, [publication?.publication_id, executeUpdate]);

  /**
   * PUBLIC API: Update a content block field (e.g., subtitle, servings).
   */
  const updateContentField = useCallback(async (contentId: string, fields: SimpleUpdatePayload) => {
    // Content update is simple: executeUpdate with the content ID
    return executeUpdate(contentId, fields);
  }, [executeUpdate]);
  
  /**
   * PUBLIC API: Update an ingredient field (e.g., quantity, product name).
   * FIX: Reconstruit et envoie la publication complète avec l'ingrédient modifié.
   */
  const updateIngredientField = useCallback(async (ingredientId: string, fields: SimpleUpdatePayload) => {
    if (!publication?.publication_id || !publication.contents) return false;

    // Deep clone de la publication actuelle pour modification
    const pubToUpdate = JSON.parse(JSON.stringify(publication)) as Publication;
    let ingredientFound = false;

    // On parcourt les contenus pour trouver et modifier l'ingrédient cible
    const updatedContents = pubToUpdate.contents?.map((content) => {
      // S'il n'y a pas d'ingrédients, retourne le content tel quel
      if (!content.content_ingredients) return content;

      const updatedIngredients = content.content_ingredients.map((ing) => {
        if (ing.ingredient_id !== ingredientId) return ing;
        
        ingredientFound = true;
        
        // Cible de la mise à jour
        const ingUpdate = { 
            ...ing, 
            quantity: ing.quantity, 
            product: { ...ing.product }, 
            ingredient_units: ing.ingredient_units
        };
        
        // Appliquer les mises à jour atomiques
        if (fields.quantity !== undefined) {
          ingUpdate.quantity = fields.quantity;
        }
        
        // Mettre à jour la relation Produit
        if (fields.product !== undefined) {
          ingUpdate.product = { 
            name: fields.product.name,
          };
        }
        
        // Mettre à jour la relation Unité (gestion de la structure imbriquée)
        if (fields.ingredient_units !== undefined) {
            const newUnitName = fields.ingredient_units.name;
            const currentUnit = ing.ingredient_units?.[0];

            // FIX: Assurer que l'objet unitaire est bien encapsulé et contient l'ID existant
            // pour satisfaire le validateur et permettre l'UPDATE du nom si l'ID est connu.
            ingUpdate.ingredient_units = [{
                unit: {
                    unit_id: currentUnit?.unit_id,
                    name: newUnitName,
                }
            }];
        }

        return ingUpdate;
      });

      return { ...content, content_ingredients: updatedIngredients };
    });

    if (!ingredientFound) {
      console.error(`Ingrédient ID ${ingredientId} non trouvé dans les contenus de la publication (state local).`);
      return false;
    }
    
    // Assigner les contenus mis à jour à la publication
    pubToUpdate.contents = updatedContents;

    // --- 5. Final Payload Construction ---
    
    const payload: any = {
        action: "update",
        payload: {
            [pubToUpdate.publication_id]: pubToUpdate // FIX: Envoi du clone complet de la publication
        }
    };
    
    // Execute update
    try {
        await toast.promise(
            OrchestratorService.patch(payload),
            {
                loading: 'Mise à jour ingrédient...',
                success: 'Ingrédient mis à jour avec succès!',
                error: 'Échec de la mise à jour de l\'ingrédient.'
            }
        );
        forceReload();
        return true;
    } catch (error) {
        console.error("Échec de la mise à jour ingrédient orchestrée:", error);
        return false;
    }
    
  }, [publication?.publication_id, publication?.contents, forceReload]);
  
  /**
   * PUBLIC API: Update a segment field (e.g., title, paragraph).
   */
  const updateSegmentField = useCallback(async (segmentId: string, fields: SimpleUpdatePayload) => {
    return executeUpdate(segmentId, fields);
  }, [executeUpdate]);
  

  // --- 2. Structural Mutation Handlers (Add/Delete) ---

  /**
   * Helper to create a standardized structural payload for Orchestrator (Add/Delete).
   */
  const buildStructuralPayload = useCallback((
    action: "create" | "delete",
    resourceId: string, // ID de la ressource parente (content_id) ou de la ressource à supprimer
    resourceType: "ingredient" | "segment",
  ): any => {
    if (!publication?.publication_id) return { action: "invalid", payload: {} };
    
    const publicationId = publication.publication_id;

    if (action === "delete") {
        // For atomic delete on a sub-resource, we use the specific resource ID
        return { action: "delete", payload: { [resourceId]: null } };
    }

    // CREATE (ResourceId here is the contentId)
    const contentBlock = publication.contents?.find(c => c.content_id === resourceId);
    if (!contentBlock) return { action: "invalid", payload: {} };
    
    let newItem: any;
    if (resourceType === "ingredient") {
        // Payload minimal for unconfirmed ingredient creation
        newItem = { 
            quantity: 0, 
            multiply_factor: 1, 
            product: { name: "Nouvel ingrédient" },
            ingredient_units: [{ unit: { name: "unité" } }], // FIX: Ajout de 'unit' pour la création
            connect: { content_id: resourceId }
        };
    } else if (resourceType === "segment") {
        // Payload minimal for unconfirmed segment creation
        newItem = { 
            title: "Nouvelle étape", 
            paragraph: "Description de l'étape",
            connect: { content_id: resourceId } 
        };
    }

    // The CREATE payload targets the specific content block ID.
    return {
        action: "create",
        payload: {
            [resourceId]: newItem // Key = Content ID (where to insert)
        }
    };

  }, [publication?.publication_id, publication?.contents]);

  
  /**
   * Exécute l'opération de mutation (Add/Delete) via l'Orchestrator.
   */
  const executeMutation = useCallback(async (payload: any, successMessage: string) => {
    if (!isAuthenticated) {
        toast.error("Authentification requise pour la mutation.");
        return false;
    }
    
    try {
        const response = await toast.promise(
            OrchestratorService.send(payload),
            {
                loading: 'Opération en cours...',
                success: successMessage,
                error: (err) => `Échec: ${err.message || 'Erreur interne'}`
            }
        );
        forceReload();
        return response.success ?? false;
    } catch (error) {
        console.error("Échec de la mutation orchestrée:", error);
        return false;
    }
  }, [isAuthenticated, forceReload]);


  // Mutation API pour Ingrédient
  const addIngredient = useCallback(async (contentId: string) => {
    const payload = buildStructuralPayload("create", contentId, "ingredient");
    if (payload.action === "invalid") return false;
    return executeMutation(payload, "Ingrédient ajouté.");
  }, [buildStructuralPayload, executeMutation]);

  const deleteIngredient = useCallback(async (ingredientId: string) => {
    const payload = buildStructuralPayload("delete", ingredientId, "ingredient");
    return executeMutation(payload, "Ingrédient supprimé.");
  }, [buildStructuralPayload, executeMutation]);


  // Mutation API pour Segment
  const addSegment = useCallback(async (contentId: string) => {
    const payload = buildStructuralPayload("create", contentId, "segment");
    if (payload.action === "invalid") return false;
    return executeMutation(payload, "Segment ajouté.");
  }, [buildStructuralPayload, executeMutation]);

  const deleteSegment = useCallback(async (segmentId: string) => {
    const payload = buildStructuralPayload("delete", segmentId, "segment");
    return executeMutation(payload, "Segment supprimé.");
  }, [buildStructuralPayload, executeMutation]);
  

  /** Fetch principal, s'exécute au montage et au rechargement forcé */
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
      const result = await getFn(id!);
      if (result) {
        setPublication(result as Publication);
        return;
      }

      navigate("/404", { replace: true });
    } catch (err) {
      if (isAuthenticated) {
        try {
          const fallback = await PublicationsService.getPublicPublicationById(id!);
          if (fallback) {
            setPublication(fallback as Publication);
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

  /** Exécute le fetch sur montage et sur changement de forceRefetch */
  useEffect(() => {
    fetchPublication();
  }, [fetchPublication, forceRefetch]);

  /** gestion de cases cochées */
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
    
    // Public API for inline editing (Updates)
    updatePublicationField,
    updateContentField,
    updateIngredientField,
    updateSegmentField,

    // Public API for structural mutations (Add/Delete)
    addIngredient,
    deleteIngredient,
    addSegment,
    deleteSegment,
  };
}
