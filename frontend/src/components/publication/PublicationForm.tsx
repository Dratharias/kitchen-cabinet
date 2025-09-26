import { usePayloadBuilder, FormContent } from "@/hooks/usePayloadBuilder";
import { usePost } from "@/hooks/usePost";
import { isAuthenticated } from "@/stores/authStore";
import {
  fetchProducts,
  fetchUnits,
  fetchPublications,
} from "@/utils/fetchTransformers";
import { createSignal, onMount, Show } from "solid-js";
import { createStore } from "solid-js/store";
import { Button } from "../ui/atoms/Button";
import { Span } from "../ui/atoms/Span";
import { FormDescription, FormNote } from "./DescriptionLogicHandler";
import { PublicationContents } from "./PublicationContents";
import { PublicationDescription } from "./PublicationDescription";
import { PublicationMetaFields } from "./PublicationMetaFields";
import { PublicationTags } from "./PublicationTags";
import { API_BASE } from "@/config/api";

// --- Category fetcher ---
async function fetchCategoriesByType(type: string) {
  const token = localStorage.getItem("auth_token");
  if (!token) return [];
  const res = await fetch(`${API_BASE}/api/categories?type=${type}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return [];
  return res.json();
}

// --- Single publication fetch ---
async function fetchPublicationById(id: string) {
  const token = localStorage.getItem("auth_token");
  if (!token) return null;
  const res = await fetch(`${API_BASE}/api/private/publications/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return null;
  return res.json();
}

interface PublicationFormProps {
  publicationId?: string;
  onSuccess?: (publication: any) => void;
  onCancel?: () => void;
}

export function PublicationForm(props: PublicationFormProps) {
  const { postPublicate, loading, error } = usePost();
  const { buildComplexPublicationPayload } = usePayloadBuilder();
  const [message, setMessage] = createSignal("");
  const [isEdit] = createSignal(Boolean(props.publicationId));

  // --- New inputs store ---
  const [newInputs, setNewInputs] = createStore({
    author: "",
    type: "",
    style: "",
  });

  // --- Form store ---
  const [form, setForm] = createStore({
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

  // --- Load publication if edit mode ---
  onMount(async () => {
    if (props.publicationId && isAuthenticated()) {
      const publication = await fetchPublicationById(props.publicationId);
      if (publication) {
        setForm({
          title: publication.title || "",
          descriptions:
            publication.description?.map((desc: string) => ({
              text: desc,
              id: crypto.randomUUID(),
            })) || [],
          notes:
            publication.note?.map((note: string) => ({
              text: note,
              id: crypto.randomUUID(),
            })) || [],
          public: publication.public || false,
          published: publication.published || false,
          thumbnail: publication.thumbnail || "",
          type: publication.type?.str_value || "",
          style: publication.style?.str_value || "",
          author: publication.author?.str_value || "",
          tags: publication.tags?.map((t: any) => t.str_value) || [],
          contents: publication.contents || [],
        });
      }
    }
  });

  // --- Submit handler ---
  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    setMessage("");

    const finalAuthor = form.author === "new" ? newInputs.author : form.author;
    const finalType = form.type === "new" ? newInputs.type : form.type;
    const finalStyle = form.style === "new" ? newInputs.style : form.style;

    const payload = buildComplexPublicationPayload(
      isEdit() ? "update" : "create",
      props.publicationId ?? "1",
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
      form.contents,
    );

    const res = await postPublicate(payload);

    if (res) {
      setMessage(isEdit() ? "Publication mise à jour" : "Publication créée");
      props.onSuccess?.(res);
    } else {
      setMessage("Erreur lors de l'opération");
    }
  };

  return (
    <div class="mx-auto p-6 w-full max-w-4xl border-prim-txt dark:border-prim-txt-d">
      <div class="min-w-screen opacity-0">
        Invisible div for width adjustment
      </div>
      <div class="flex justify-center items-center mb-6">
        <Span class="text-2xl font-bold text-center w-full">
          {isEdit() ? "Modifier la publication" : "Nouvelle publication"}
        </Span>
      </div>

      <form onSubmit={handleSubmit} class="space-y-6">
        <PublicationMetaFields
          form={form}
          setForm={setForm}
          newInputs={newInputs}
          setNewInputs={setNewInputs}
          fetchers={{
            fetchAuthors: () => fetchCategoriesByType("Author"),
            fetchTypes: () => fetchCategoriesByType("Type"),
            fetchStyles: () => fetchCategoriesByType("Style"),
          }}
        />

        <Show when={form.title}>
          <PublicationDescription form={form} setForm={setForm} />
          <PublicationTags form={form} setForm={setForm} />
          <PublicationContents
            contents={form.contents}
            setForm={setForm}
            productsFetcher={fetchProducts}
            unitsFetcher={fetchUnits}
            publicationsFetcher={fetchPublications}
          />

          <div class="flex gap-4 pt-4">
            <Button type="submit" disabled={loading()}>
              {loading()
                ? "Traitement..."
                : isEdit()
                  ? "Mettre à jour"
                  : "Publier"}
            </Button>
            <Show when={props.onCancel}>
              <Button type="button" onClick={props.onCancel}>
                Annuler
              </Button>
            </Show>
          </div>
        </Show>

        <Show when={message()}>
          <p
            class={
              message().includes("mise") || message().includes("créée")
                ? "text-green-600"
                : "text-red-600"
            }
          >
            <Span>{message()}</Span>
          </p>
        </Show>

        <Show when={error()}>
          <p class="text-red-500">
            <Span>{error()}</Span>
          </p>
        </Show>
      </form>
    </div>
  );
}
