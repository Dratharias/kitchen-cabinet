import { For } from "solid-js";
import { Input } from "@/components/ui/atoms/Input";
import { Button } from "@/components/ui/atoms/Button";

export function PublicationTags({ form, setForm }) {
  const addTag = () => {
    const input = document.querySelector('[data-tag-input]') as HTMLInputElement;
    if (input && input.value.trim()) {
      setForm("tags", [...form.tags, input.value.trim()]);
      input.value = "";
    }
  };

  const removeTag = (index: number) => {
    setForm("tags", form.tags.filter((_: any, i: number) => i !== index));
  };

  return (
    <div>
      <label class="block text-sm font-medium mb-1">Tags</label>
      <div class="flex flex-wrap gap-2 mb-2">
        <For each={form.tags}>
          {(tag: string, index) => (
            <span class="bg-blue-100 text-blue-800 px-2 py-1 rounded-md text-sm flex items-center">
              {tag}
              <button
                type="button"
                onClick={() => removeTag(index())}
                class="ml-1 text-blue-600 hover:text-blue-800"
              >
                ×
              </button>
            </span>
          )}
        </For>
      </div>
      <div class="flex gap-2">
        <Input
          data-tag-input
          placeholder="Ajouter un tag"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addTag();
            }
          }}
        />
        <Button type="button" onClick={addTag}>Ajouter</Button>
      </div>
    </div>
  );
}
