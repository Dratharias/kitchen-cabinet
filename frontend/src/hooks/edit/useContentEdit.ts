import { useState, useCallback } from "react";
import { OrchestratorService } from "@/services/orchestrator";
import type { OrchestratorPayload } from "@/types/payloadBuilder";

export function useContentEdit(publication: any) {
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

  const confirmContent = useCallback(
    async (contentId: string, field: "subtitle" | "servings") => {
      if (!publication) return;
      const val = editValues[`${field}-${contentId}`];
      if (val === undefined) return;

      setIsLoading(true);
      try {
        const payload: OrchestratorPayload = {
          action: "update",
          payload: { [contentId]: { [field]: val } },
        };
        await OrchestratorService.patch(payload);
      } catch (err) {
        console.error("Erreur confirmContent:", err);
      } finally {
        setIsLoading(false);
        setEditingField(null);
      }
    },
    [publication, editValues]
  );

  const deleteContent = useCallback(async (contentId: string) => {
    setIsLoading(true);
    try {
      const payload: OrchestratorPayload = {
        action: "delete",
        payload: { [contentId]: null },
      };
      await OrchestratorService.send(payload);
    } catch (e) {
      console.error("Erreur deleteContent:", e);
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
    confirmContent,
    deleteContent,
  };
}
