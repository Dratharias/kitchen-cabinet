import { useState, useCallback } from "react";
import { OrchestratorService } from "@/services/orchestrator";
import type { OrchestratorPayload } from "@/types/payloadBuilder";

export function useSegmentEdit(publication: any) {
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

  const confirmSegment = useCallback(
    async (segmentId: string, field: "title" | "paragraph" | "position") => {
      if (!publication) return;
      const val = editValues[`${field}-${segmentId}`];
      if (val === undefined) return;

      setIsLoading(true);
      try {
        const payload: OrchestratorPayload = {
          action: "update",
          payload: { [segmentId]: { [field]: val } },
        };
        await OrchestratorService.patch(payload);
      } catch (err) {
        console.error("Erreur confirmSegment:", err);
      } finally {
        setIsLoading(false);
        setEditingField(null);
      }
    },
    [publication, editValues]
  );

  const addSegment = useCallback(async () => {
    if (!publication) return;
    setIsLoading(true);
    try {
      const payload: OrchestratorPayload = {
        action: "create",
        payload: {
          [publication.publication_id]: {
            title: "Nouvelle étape",
            paragraph: "",
            position: 1,
          },
        },
      };
      await OrchestratorService.send(payload);
    } catch (e) {
      console.error("Erreur addSegment:", e);
    } finally {
      setIsLoading(false);
    }
  }, [publication]);

  const deleteSegment = useCallback(async (segmentId: string) => {
    setIsLoading(true);
    try {
      const payload: OrchestratorPayload = {
        action: "delete",
        payload: { [segmentId]: null },
      };
      await OrchestratorService.send(payload);
    } catch (e) {
      console.error("Erreur deleteSegment:", e);
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
    confirmSegment,
    addSegment,
    deleteSegment,
  };
}
