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
   * Assumes the ID passed is for the *main* resource (Publication, Content, Segment, Ingredient).
   */
  const buildMicroUpdatePayload = useCallback((id: string, fields: SimpleUpdatePayload): any => {
    // Description: Traitée comme un tableau si c'est une chaîne multiligne
    if (fields.description && typeof fields.description === 'string') {
        fields.description = fields.description.split('\n');
    }
    
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
    
    // Si l'ID n'est pas une publication ou un contenu, on tente de le traiter atomiquement
    // NOTE: L'orchestrator du backend a été mis à jour pour gérer ces ID directs.
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


  // --- 1. Update Handlers (Updates atomiques vers Orchestrator) ---

  const updatePublicationField = useCallback(async (fields: SimpleUpdatePayload) => {
    if (!publication?.publication_id) return false;
    return executeUpdate(publication.publication_id, fields);
  }, [publication?.publication_id, executeUpdate]);

  const updateContentField = useCallback(async (contentId: string, fields: SimpleUpdatePayload) => {
    // Servings nécessite une conversion de string (label) à ServingsData (objet)
    if (fields.servings && typeof fields.servings === 'string') {
        const match = fields.servings.match(/(\d+)\s*(.*)/) || [];
        const yieldValue = parseInt(match[1], 10) || 1;
        const unitValue = match[2].trim() || (yieldValue > 1 ? 'portions' : 'portion');
        
        // Le DTO attend un ServingsData object
        fields.servings = { yield: yieldValue, value: unitValue };
    }
    
    return executeUpdate(contentId, fields);
  }, [executeUpdate]);
  
  /**
   * PUBLIC API: Update an ingredient field (e.g., quantity, product name, unit).
   */
  const updateIngredientField = useCallback(async (ingredientId: string, fields: SimpleUpdatePayload) => {
    // Si la mise à jour concerne une sous-ressource de l'ingrédient, 
    // le payload est préparé pour le contrôleur atomique du backend
    
    const updateFields: SimpleUpdatePayload = {};
    
    if (fields.quantity !== undefined) {
      updateFields.quantity = Number(fields.quantity);
    }
    
    // Mettre à jour le Produit (nom)
    if (fields.product !== undefined) {
      // Le backend attend la structure { product: { name: newName } }
      updateFields.product = { name: fields.product };
    }
    
    // Mettre à jour l'Unité (nom)
    if (fields.unit !== undefined) {
      // Le backend attend la structure { ingredient_units: [{ unit: { name: newName } }] }
      // Nous ne gérons ici qu'une seule unité par ingrédient.
      updateFields.ingredient_units = [{ unit: { name: fields.unit } }];
    }
    
    return executeUpdate(ingredientId, updateFields);
    
  }, [executeUpdate]);
  
  const updateSegmentField = useCallback(async (segmentId: string, fields: SimpleUpdatePayload) => {
    // Pas de manipulation complexe ici, le contrôleur atomique gère title/paragraph
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
    if (action === "delete") {
        // Pour la suppression atomique, l'ID de la ressource à supprimer est la clé.
        return { action: "delete", payload: { [resourceId]: null } };
    }

    // CREATE (ResourceId here is the contentId)
    let newItem: any;
    if (resourceType === "ingredient") {
        // Payload minimal pour la création d'ingrédient
        newItem = { 
            quantity: 1, 
            multiply_factor: 1, 
            product: { name: "Nouvel ingrédient" },
            ingredient_units: [{ unit: { name: "unité" } }],
        };
    } else if (resourceType === "segment") {
        // Payload minimal pour la création de segment
        newItem = { 
            title: "Nouvelle étape", 
            paragraph: "Description de l'étape",
        };
    }
    
    // L'orchestrator attend un payload qui sera traité pour la création.
    // L'ID est la clé de la ressource parente (contentId)
    return {
        action: "create",
        payload: {
            [resourceId]: newItem 
        }
    };

  }, []);

  
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
        // NOTE: L'orchestrator retourne l'ID de la ressource créée dans `results`
        // mais pour une simple mutation d'ajout, on retourne le succès.
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

    try {
      const result = await PublicationsService.getPublicationById(id!);
      if (result) {
        setPublication(result as Publication);
        return;
      }

      navigate("/404", { replace: true });
    } catch (err) {
      if (isAuthenticated) {
        try {
          const fallback = await PublicationsService.getPublicationById(id!);
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
