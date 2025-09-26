import { Input } from "@/components/ui/atoms/Input";
import { DescriptionList } from "./DescriptionList";
import { FormDescription, FormNote } from "./DescriptionLogicHandler";

export function PublicationDescription({
  form,
  setForm,
}: {
  form: {
    descriptions: FormDescription[];
    notes: FormNote[];
    thumbnail: string;
    public: boolean;
    published: boolean;
  };
  setForm: (...args: any[]) => void;
}) {
  return (
    <>
      <DescriptionList
        descriptions={form.descriptions}
        notes={form.notes}
        setForm={setForm}
      />

      <div class="space-y-4">
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
      </div>
    </>
  );
}
