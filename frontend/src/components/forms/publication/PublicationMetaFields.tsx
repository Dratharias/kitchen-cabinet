import { For, Show } from "solid-js";
import { Input } from "@/components/ui/atoms/Input";

export function PublicationMetaFields({ form, setForm, authors, types, styles, newInputs, setNewInputs }) {
  const handleChange = (field: "author" | "type" | "style", value: string) => {
    if (value === "new") {
      setForm(field, "new");
      setNewInputs(field, "");
    } else {
      setForm(field, value);
      setNewInputs(field, "");
    }
  };

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

      {/* Auteur */}
      <div>
        <label class="block text-sm font-medium mb-1">Auteur</label>
        <select
          class="w-full px-3 py-2 border border-gray-300 rounded-md"
          value={form.author}
          onChange={(e) => handleChange("author", e.currentTarget.value)}
        >
          <option value="">Sélectionner un auteur</option>
          <Show when={authors}>
            <For each={authors}>
              {(a: any) => <option value={a.str_value}>{a.str_value}</option>}
            </For>
          </Show>
          <option value="new">+ Nouvel auteur</option>
        </select>
        <Show when={form.author === "new"}>
          <Input
            placeholder="Nom du nouvel auteur"
            class="mt-2"
            value={newInputs.author}
            onInput={(e) => setNewInputs("author", e.currentTarget.value)}
          />
        </Show>
      </div>

      {/* Type */}
      <div>
        <label class="block text-sm font-medium mb-1">Type</label>
        <select
          class="w-full px-3 py-2 border border-gray-300 rounded-md"
          value={form.type}
          onChange={(e) => handleChange("type", e.currentTarget.value)}
        >
          <option value="">Sélectionner un type</option>
          <Show when={types}>
            <For each={types}>
              {(t: any) => <option value={t.str_value}>{t.str_value}</option>}
            </For>
          </Show>
          <option value="new">+ Nouveau type</option>
        </select>
        <Show when={form.type === "new"}>
          <Input
            placeholder="Nom du nouveau type"
            class="mt-2"
            value={newInputs.type}
            onInput={(e) => setNewInputs("type", e.currentTarget.value)}
          />
        </Show>
      </div>

      {/* Style */}
      <div>
        <label class="block text-sm font-medium mb-1">Style</label>
        <select
          class="w-full px-3 py-2 border border-gray-300 rounded-md"
          value={form.style}
          onChange={(e) => handleChange("style", e.currentTarget.value)}
        >
          <option value="">Sélectionner un style</option>
          <Show when={styles}>
            <For each={styles}>
              {(s: any) => <option value={s.str_value}>{s.str_value}</option>}
            </For>
          </Show>
          <option value="new">+ Nouveau style</option>
        </select>
        <Show when={form.style === "new"}>
          <Input
            placeholder="Nom du nouveau style"
            class="mt-2"
            value={newInputs.style}
            onInput={(e) => setNewInputs("style", e.currentTarget.value)}
          />
        </Show>
      </div>
    </div>
  );
}
