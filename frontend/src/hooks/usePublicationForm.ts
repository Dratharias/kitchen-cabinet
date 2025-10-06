import { useState, useEffect } from "react";
import { usePost } from "@/hooks/usePost";
import { usePayloadBuilder, FormContent } from "@/hooks/usePayloadBuilder";
import { useAuthStore } from "@/stores/authStore";
import { API_BASE } from "@/config/api";

async function fetchPublicationById(id: string) {
  const token = localStorage.getItem("auth_token");
  if (!token) return null;

  const res = await fetch(`${API_BASE}/api/private/publications/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) return null;
  return res.json();
}

export interface FormDescription {
  id: string;
  text: string;
}
export interface FormNote {
  id: string;
  text: string;
}

export function usePublicationForm(publicationId?: string) {
  const { postPublicate, loading, error } = usePost();
  const { buildComplexPublicationPayload } = usePayloadBuilder();
  const { isAuthenticated } = useAuthStore();

  const [message, setMessage] = useState("");
  const [isEdit] = useState(Boolean(publicationId));

  const [newInputs, setNewInputs] = useState({
    author: "",
    type: "",
    style: "",
  });

  const [form, setForm] = useState({
    title: "",
    descriptions: [] as FormDescription[],
    notes: [] as FormNote[],
    public: true,
    published: true,
    thumbnail: "",
    type: "",
    style: "",
    author: "",
    tags: [] as string[],
    contents: [] as FormContent[],
  });

  // Chargement pour édition
  useEffect(() => {
    const loadPublication = async () => {
      if (publicationId && isAuthenticated) {
        const pub = await fetchPublicationById(publicationId);
        if (pub) {
          setForm({
            title: pub.title ?? "",
            descriptions:
              pub.description?.map((d: string) => ({
                id: crypto.randomUUID(),
                text: d,
              })) ?? [],
            notes:
              pub.note?.map((n: string) => ({
                id: crypto.randomUUID(),
                text: n,
              })) ?? [],
            public: pub.public ?? false,
            published: pub.published ?? false,
            thumbnail: pub.thumbnail ?? "",
            type: pub.type?.str_value ?? "",
            style: pub.style?.str_value ?? "",
            author: pub.author?.str_value ?? "",
            tags: pub.tags?.map((t: any) => t.str_value) ?? [],
            contents: pub.contents ?? [],
          });
        }
      }
    };
    loadPublication();
  }, [publicationId, isAuthenticated]);

  const handleSubmit = async (): Promise<any | null> => {
    setMessage("");

    const finalAuthor = form.author === "new" ? newInputs.author : form.author;
    const finalType = form.type === "new" ? newInputs.type : form.type;
    const finalStyle = form.style === "new" ? newInputs.style : form.style;

    const payload = buildComplexPublicationPayload(
      isEdit ? "update" : "create",
      publicationId ?? "1",
      {
        title: form.title,
        description: form.descriptions.map((d) => d.text),
        note: form.notes.map((n) => n.text),
        public: form.public,
        published: form.published,
        thumbnail: form.thumbnail || undefined,
        type: finalType
          ? { data: { str_value: finalType, type: "Type" } }
          : undefined,
        style: finalStyle
          ? { data: { str_value: finalStyle, type: "Style" } }
          : undefined,
        author: finalAuthor
          ? { data: { str_value: finalAuthor, type: "Author" } }
          : undefined,
        tags: form.tags.map((t) => ({ data: { str_value: t, type: "Tag" } })),
      },
      form.contents
    );

    const res = await postPublicate(payload);
    if (res) {
      setMessage(
        isEdit
          ? "Publication mise à jour avec succès"
          : "Publication créée avec succès"
      );
      return res;
    } else {
      setMessage("Erreur lors de l'opération");
      return null;
    }
  };

  return {
    form,
    setForm,
    newInputs,
    setNewInputs,
    isEdit,
    loading,
    error,
    message,
    setMessage,
    handleSubmit,
  };
}
