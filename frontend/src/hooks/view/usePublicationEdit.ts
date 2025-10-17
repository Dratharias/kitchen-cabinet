import { useState } from "react";
import { useAuthStore } from "@/stores/authStore";

export function usePublicationEdit() {
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Record<string, any>>({});
  const { isAuthenticated } = useAuthStore();

  const startEdit = (fieldId: string, currentValue: any) => {
    setEditingField(fieldId);
    setEditValues({ [fieldId]: currentValue });
  };

  const cancelEdit = () => {
    setEditingField(null);
    setEditValues({});
  };

  const updateValue = (fieldId: string, value: any) => {
    setEditValues({ ...editValues, [fieldId]: value });
  };

  return {
    editingField,
    editValues,
    startEdit,
    cancelEdit,
    updateValue,
    setEditingField,
    isAuthenticated,
  };
}