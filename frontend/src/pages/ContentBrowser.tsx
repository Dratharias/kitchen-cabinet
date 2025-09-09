import { Component, createResource, For, Show } from "solid-js";
import { useApiFetch } from "../hooks/useApiFetch";

interface ContentBrowserProps {
  feeds?: boolean;
  library?: boolean;
}

interface Publication {
  publicationId: string;
  title: string;
  description: string[];
  type?: { strValue: string };
  style?: { strValue: string };
  thumbnail?: string;
  author?: { strValue: string };
}

export const ContentBrowser: Component<ContentBrowserProps> = (props) => {
  // Détermine la section et l'endpoint
  const section = props.feeds ? "feeds" : props.library ? "library" : null;
  const endpoint = section ? `/api/publications/${section}` : null;

  // Resource unique
  const [publications] = createResource(endpoint, endpoint ? () => useApiFetch<Publication[]>(endpoint) : undefined);

  if (props.feeds && props.library) {
    console.warn("ContentBrowser: ne doit pas recevoir feeds et library en même temps. Affichage des feeds uniquement.");
  }

  if (!section) return <p>Section inconnue</p>;

  // Filtrage selon type pour la section
  const filteredPublications = () => {
    if (!publications()) return [];
    if (section === "feeds") {
      return publications().filter(pub => pub.type?.strValue === "Article" || pub.type?.strValue === "Recipe");
    } else if (section === "library") {
      return publications().filter(pub => pub.type?.strValue === "Book" || pub.type?.strValue === "Review");
    }
    return publications();
  };

  return (
    <div class="content-browser w-full p-4 bg-amber-50">
      <section class={section}>
        <h2>{section === "feeds" ? "Feeds" : "Library"}</h2>

        <Show when={publications.loading}><p>Chargement des publications...</p></Show>
        <Show when={publications.error}><p>Erreur lors du chargement des publications.</p></Show>
        <Show when={!publications.loading && filteredPublications().length === 0}>
          <p>{section === "feeds" ? "Aucun feed disponible pour le moment." : "Votre bibliothèque est vide."}</p>
        </Show>

        <For each={filteredPublications()}>
          {(pub) => (
            <article class="publication-item border-b p-2">
              <h3>{pub.title}</h3>
              {pub.thumbnail && <img src={pub.thumbnail} alt={pub.title} class="w-32 h-32 object-cover" />}
              <p>{pub.description?.[0]}</p>
              <p class="text-sm text-gray-500">
                {pub.type?.strValue} {pub.style ? `• ${pub.style.strValue}` : ""}
              </p>
            </article>
          )}
        </For>
      </section>
    </div>
  );
};
