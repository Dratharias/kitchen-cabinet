import { createSignal, Show, onMount } from "solid-js";
import { createStore } from "solid-js/store";
import { usePost } from "@/hooks/usePost";
import { usePayloadBuilder } from "@/hooks/usePayloadBuilder";
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
  const { buildPublicationPayload } = usePayloadBuilder();
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
    contents: [] as any[],
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

    const payload = buildPublicationPayload(
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
        contents: form.contents.map((c, idx) => ({
          data: {
            total_prep_time: c.total_prep_time || 0,
            servings: c.servings,
          },
          content_segments: c.segments?.map((s: any, si: number) => ({
            position: si + 1,
            segment: {
              data: { title: s.title, paragraph: s.paragraph },
              segment_prep_time: s.prepTimes?.map((p: any) => ({
                prep_time: {
                  data: { duration: p.duration },
                  style: p.style
                    ? { data: { str_value: p.style, type: "PrepTimeStyle" } }
                    : undefined,
                },
              })),
            },
          })),
          content_ingredients: c.ingredients?.map((i: any) => ({
            data: { quantity: i.quantity, multiply_factor: i.multiply_factor },
            product: i.isNewProduct
              ? {
                  data: {
                    name: i.product_name,
                    en_name: i.product_en_name || i.product_name,
                    publication: i.publication_id
                      ? { id: i.publication_id, data: {} }
                      : undefined,
                  },
                }
              : { id: i.product_id, data: {} },
            ingredient_units: i.unit
              ? [{ unit: { data: { name: i.unit } } }]
              : [],
          })),
          content_prep_times: c.prepTimes?.map((p: any) => ({
            prep_time: { data: { duration: p.duration } },
          })),
        })),
      },
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
