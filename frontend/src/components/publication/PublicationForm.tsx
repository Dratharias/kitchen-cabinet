import { createSignal, Show, onMount } from "solid-js";
import { createStore } from "solid-js/store";
import { usePost } from "@/hooks/usePost";
import { usePayloadBuilder, FormContent } from "@/hooks/usePayloadBuilder";
import { Button } from "@/components/ui/atoms/Button";
import { Span } from "@/components/ui/atoms/Span";
import { PublicationMetaFields } from "./PublicationMetaFields";
import { PublicationDescription } from "./PublicationDescription";
import { PublicationTags } from "./PublicationTags";
import { PublicationContents } from "./PublicationContents";
import { isAuthenticated } from "@/stores/authStore";

const API_BASE =
  import.meta.env.VITE_API_URL ||
  `http://localhost:${import.meta.env.VITE_API_PORT}`;

// --- Fetchers granulaire ---
async function fetchCategoriesByType(type: string) {
  const token = localStorage.getItem("auth_token");
  if (!token) return [];
  const res = await fetch(`${API_BASE}/api/categories?type=${type}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return [];
  return res.json();
}

async function fetchProducts() {
  const token = localStorage.getItem("auth_token");
  if (!token) return [];
  const res = await fetch(`${API_BASE}/api/products`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return [];
  return res.json();
}

async function fetchUnits() {
  const token = localStorage.getItem("auth_token");
  if (!token) return [];
  const res = await fetch(`${API_BASE}/api/units`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return [];
  return res.json();
}

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

  // --- Form store ---
  const [newInputs, setNewInputs] = createStore({
    author: "",
    type: "",
    style: "",
  });

  const [form, setForm] = createStore({
    title: "",
    description: "",
    note: "",
    public: true,
    published: true,
    thumbnail: "",
    type: "",
    style: "",
    author: "",
    tags: [] as string[],
    contents: [] as FormContent[], // typé clairement
  });

  // --- Load publication if edit mode ---
  onMount(async () => {
    if (props.publicationId && isAuthenticated()) {
      const publication = await fetchPublicationById(props.publicationId);
      if (publication) {
        setForm({
          title: publication.title || "",
          description: publication.description?.[0] || "",
          note: publication.note?.[0] || "",
          public: publication.public || false,
          published: publication.published || false,
          thumbnail: publication.thumbnail || "",
          type: publication.type?.str_value || "",
          style: publication.style?.str_value || "",
          author: publication.author?.str_value || "",
          tags: publication.tags?.map((t: any) => t.str_value) || [],
          contents: publication.contents || [], // ⚠️ si API renvoie pas FormContent -> adapter
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
        description: [form.description],
        note: [form.note],
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

    console.log(
      "Payload envoyé à /api/publicate :",
      JSON.stringify(payload, null, 2),
    );

    const res = await postPublicate(payload);

    if (res) {
      setMessage(
        isEdit()
          ? "Publication mise à jour avec succès"
          : "Publication créée avec succès",
      );
      props.onSuccess?.(res);
    } else {
      setMessage("Erreur lors de l'opération");
    }
  };

  return (
    <div class="mx-auto p-6 w-full max-w-4xl border-prim-txt dark:border-prim-txt-d">
      <div class="flex justify-center items-center mb-6">
        <Span class="text-2xl font-bold min-w-screen text-center">
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
              message().includes("succès") ? "text-green-600" : "text-red-600"
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
