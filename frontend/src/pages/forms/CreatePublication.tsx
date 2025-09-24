import { createSignal } from "solid-js";
import { Button } from "@/components/ui/atoms/Button";
import { Input } from "@/components/ui/atoms/Input";
import { Span } from "@/components/ui/atoms/Span";

export function PublicationForm() {
  const [title, setTitle] = createSignal("");
  const [description, setDescription] = createSignal("");
  const [author, setAuthor] = createSignal("");
  const [loading, setLoading] = createSignal(false);
  const [message, setMessage] = createSignal("");

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const payload = {
      action: "create",
      payload: {
        "1": {
          title: title(),
          description: [description()],
          note: ["Created from form"],
          public: true,
          published: true,
          type: { data: { str_value: "Recipe", type: "Type" } },
          style: { data: { str_value: "Cocktail", type: "Style" } },
          author: { data: { str_value: author(), type: "Author" } },
          contents: [
            {
              data: { total_prep_time: 10, servings: 4 },
              content_segments: [
                {
                  position: 1,
                  segment: {
                    data: { paragraph: "This is a segment with a prep time.", title: "Prep Segment" },
                    segment_prep_time: [
                      {
                        prep_time: {
                          data: { duration: 5 },
                          style: { data: { str_value: "Prep", type: "PrepTimeStyle" } }
                        }
                      }
                    ]
                  }
                }
              ],
              content_ingredients: [
                {
                  data: { quantity: 1, multiply_factor: 1.0 },
                  product: {
                    data: {
                      name: "Super Product",
                      en_name: "Super Product",
                      publication: {
                        id: "existing-publication-id",
                        data: {}
                      }
                    }
                  },
                  ingredient_units: [
                    { unit: { data: { name: "grams" } } }
                  ]
                }
              ],
              content_prep_times: [
                { prep_time: { data: { duration: 5 } } }
              ]
            }
          ],
          tags: [
            { data: { str_value: "Fast", type: "Tag" } },
            { data: { str_value: "Easy", type: "Tag" } }
          ]
        }
      }
    };

    try {
      const res = await fetch("/api/publicate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error(`Erreur ${res.status}`);

      setMessage("Publication créée avec succès");
    } catch (err) {
      console.error(err);
      setMessage("Erreur lors de la publication");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div class="flex items-center justify-center min-h-[70vh] w-full text-prim-txt dark:text-prim-txt-d">
      <form onSubmit={handleSubmit} class="w-full max-w-sm space-y-4">
        <h2 class="text-xl font-bold mb-4">Nouvelle publication</h2>
        <label class="block text-sm font-medium">
          Title
          <Input
            type="text"
            value={title()}
            onInput={(e) => setTitle(e.currentTarget.value)}
            required
            class="mt-1"
          />
        </label>
        <label class="block text-sm font-medium">
          Description
          <Input
            type="text"
            value={description()}
            onInput={(e) => setDescription(e.currentTarget.value)}
            required
            class="mt-1"
          />
        </label>
        <label class="block text-sm font-medium">
          Author
          <Input
            type="text"
            value={author()}
            onInput={(e) => setAuthor(e.currentTarget.value)}
            required
            class="mt-1"
          />
        </label>
        <Button type="submit" disabled={loading()}>
          {loading() ? "Publication..." : "Publier"}
        </Button>
        {message() && (
          <p class="mt-2 text-sm font-semibold">
            <Span>{message()}</Span>
          </p>
        )}
      </form>
    </div>
  );
}
