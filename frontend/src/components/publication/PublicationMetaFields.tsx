import { SelectWithNewInput } from "@/components/ui/utilities/SelectWithNewInput";
import { Input } from "@/components/ui/atoms/Input";
import { Show } from "solid-js";

interface PublicationMetaFieldsProps {
  form: any;
  setForm: any;
  newInputs: any;
  setNewInputs: any;
  fetchers: {
    fetchAuthors: () => Promise<any[]>;
    fetchTypes: () => Promise<any[]>;
    fetchStyles: () => Promise<any[]>;
  };
}

export function PublicationMetaFields({
  form,
  setForm,
  newInputs,
  setNewInputs,
  fetchers,
}: PublicationMetaFieldsProps) {
  return (
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label class="block text-sm font-medium mb-1">Titre *</label>
        <Input
          placeholder="Titre de la publication"
          value={form.title}
          onInput={(e) => setForm("title", e.currentTarget.value)}
          required
        />
      </div>

      <Show when={form.title}>
        <SelectWithNewInput
          label="Auteur"
          value={form.author}
          fetcher={fetchers.fetchAuthors}
          newValue={newInputs.author}
          placeholder="Nom du nouvel auteur"
          onChange={(val) => setForm("author", val)}
          onNewValueChange={(val) => setNewInputs("author", val)}
        />

        <SelectWithNewInput
          label="Type"
          value={form.type}
          fetcher={fetchers.fetchTypes}
          newValue={newInputs.type}
          placeholder="Nom du nouveau type"
          onChange={(val) => setForm("type", val)}
          onNewValueChange={(val) => setNewInputs("type", val)}
        />

        <SelectWithNewInput
          label="Style"
          value={form.style}
          fetcher={fetchers.fetchStyles}
          newValue={newInputs.style}
          placeholder="Nom du nouveau style"
          onChange={(val) => setForm("style", val)}
          onNewValueChange={(val) => setNewInputs("style", val)}
        />
      </Show>
    </div>
  );
}
