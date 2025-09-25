import { Input } from "@/components/ui/atoms/Input";

export function PublicationDescription({ form, setForm }) {
  return (
    <>
      <div>
        <label class="block text-sm font-medium mb-1">Description</label>
        <textarea
          class="w-full px-3 py-2 border border-gray-300 rounded-md"
          rows="3"
          placeholder="Description de la publication"
          value={form.description}
          onInput={(e) => setForm("description", e.currentTarget.value)}
        />
      </div>

      <div>
        <label class="block text-sm font-medium mb-1">Note</label>
        <textarea
          class="w-full px-3 py-2 border border-gray-300 rounded-md"
          rows="2"
          placeholder="Notes internes"
          value={form.note}
          onInput={(e) => setForm("note", e.currentTarget.value)}
        />
      </div>

      <div>
        <label class="block text-sm font-medium mb-1">URL de l'image</label>
        <Input
          placeholder="https://example.com/image.jpg"
          value={form.thumbnail}
          onInput={(e) => setForm("thumbnail", e.currentTarget.value)}
        />
      </div>

      <div class="flex gap-4">
        <label class="flex items-center">
          <input
            type="checkbox"
            checked={form.public}
            onChange={(e) => setForm("public", e.currentTarget.checked)}
            class="mr-2"
          />
          Publication publique
        </label>
        <label class="flex items-center">
          <input
            type="checkbox"
            checked={form.published}
            onChange={(e) => setForm("published", e.currentTarget.checked)}
            class="mr-2"
          />
          Publiée
        </label>
      </div>
    </>
  );
}
