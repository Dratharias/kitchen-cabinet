import { For } from "solid-js";
import { Input } from "@/components/ui/atoms/Input";
import { Button } from "@/components/ui/atoms/Button";
import { Span } from "@/components/ui/atoms/Span";
import { CloseIcon } from "@/components/ui/atoms/Icons";

export function PublicationTags({ form, setForm }) {
  const addTag = () => {
    const input = document.querySelector(
      "[data-tag-input]",
    ) as HTMLInputElement;
    if (input && input.value.trim()) {
      setForm("tags", [...form.tags, input.value.trim()]);
      input.value = "";
    }
  };

  const removeTag = (index: number) => {
    setForm(
      "tags",
      form.tags.filter((_: any, i: number) => i !== index),
    );
  };

  return (
    <div>
      <label class="block text-sm font-medium mb-1">Tags</label>
      <div class="flex flex-wrap gap-2 mb-2">
        <For each={form.tags}>
          {(tag: string, index) => (
            <Button
              variant="noDecoration"
              onClick={() => removeTag(index())}
              class="max-w-fit !px-2 !py-1 bg-blue-100 text-blue-800 rounded-md text-sm"
              icon={<CloseIcon />}
              reverse
            >
              {tag}
            </Button>
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
        <Button type="button" onClick={addTag}>
          Ajouter
        </Button>
      </div>
    </div>
  );
}
