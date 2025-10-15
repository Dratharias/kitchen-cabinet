import { useState } from "react";
import { PayloadBuilder } from "@/services/payloadBuilder";
import { useAuthStore } from "@/stores/authStore";

export function usePublicationEdit(publicationId: string) {
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Record<string, any>>({});
  const { isAuthenticated } = useAuthStore();
  const startEdit = (fieldId: string, currentValue: any) => {
    setEditingField(fieldId);
    setEditValues({ ...editValues, [fieldId]: currentValue });
  };

  const cancelEdit = (fieldId: string) => {
    setEditingField(null);
    const { [fieldId]: _, ...rest } = editValues;
    setEditValues(rest);
  };

  const updateValue = (fieldId: string, value: any) => {
    setEditValues({ ...editValues, [fieldId]: value });
  };

  const confirmEdit = async (fieldId: string, fieldPath: string) => {
    const builder = new PayloadBuilder();
    const value = editValues[fieldId];

    const payload = builder.build("update", "publication", {
      id: publicationId,
      [fieldPath]: value,
    });

    try {
      const response = await fetch("/api/publications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error("Update failed");

      setEditingField(null);
      const { [fieldId]: _, ...rest } = editValues;
      setEditValues(rest);

      return true;
    } catch (error) {
      console.error("Failed to update:", error);
      return false;
    }
  };

  return {
    editingField,
    editValues,
    startEdit,
    cancelEdit,
    updateValue,
    confirmEdit,
    isAuthenticated,
  };
}
