import { useState, useCallback } from "react";
import { OrchestratorService } from "@/services/orchestrator";
import type { OrchestratorPayload } from "@/types/payloadBuilder";

export function useIngredientEdit(publication: any) {
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const startEdit = useCallback((fieldId: string, value: string) => {
    setEditingField(fieldId);
    setEditValues((prev) => ({ ...prev, [fieldId]: value }));
  }, []);

  const cancelEdit = useCallback((fieldId: string) => {
    setEditingField(null);
    setEditValues((prev) => {
      const { [fieldId]: _, ...rest } = prev;
      return rest;
    });
  }, []);

  const updateValue = useCallback((fieldId: string, value: string) => {
    setEditValues((prev) => ({ ...prev, [fieldId]: value }));
  }, []);

  const confirmIngredient = useCallback(
    async (ingredientId: string, field: string, resourceField: string) => {
      if (!publication) return;
      const val = editValues[`${field}-${ingredientId}`];
      if (val === undefined) return;

      setIsLoading(true);
      try {
        const payload: OrchestratorPayload = {
          action: "update",
          payload: { [ingredientId]: { [resourceField]: val } },
        };
        await OrchestratorService.patch(payload);
      } catch (err) {
        console.error("Erreur confirmIngredient:", err);
      } finally {
        setIsLoading(false);
        setEditingField(null);
      }
    },
    [publication, editValues]
  );

  const addIngredient = useCallback(async () => {
    if (!publication) return;
    setIsLoading(true);
    try {
      const payload: OrchestratorPayload = {
        action: "create",
        payload: {
          [publication.publication_id]: {
            quantity: 0,
            multiply_factor: 1,
            product: "Nouvel ingrédient",
          },
        },
      };
      await OrchestratorService.send(payload);
    } catch (e) {
      console.error("Erreur addIngredient:", e);
    } finally {
      setIsLoading(false);
    }
  }, [publication]);

  const deleteIngredient = useCallback(async (ingredientId: string) => {
    setIsLoading(true);
    try {
      const payload: OrchestratorPayload = {
        action: "delete",
        payload: { [ingredientId]: null },
      };
      await OrchestratorService.send(payload);
    } catch (e) {
      console.error("Erreur deleteIngredient:", e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    editingField,
    editValues,
    isLoading,
    startEdit,
    cancelEdit,
    updateValue,
    confirmIngredient,
    addIngredient,
    deleteIngredient,
  };
}
