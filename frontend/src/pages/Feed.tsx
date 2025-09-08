import { createResource, createEffect, Show } from "solid-js";
import { useParams, useNavigate } from "@solidjs/router";
import { isAuthenticated } from "../services/authStore";

async function fetchPublication(slug: string) {
  const res = await fetch(`/api/feed/${slug}`);
  if (!res.ok) throw new Error("Erreur lors du fetch");
  return res.json();
}

export function Feeds() {
  const params = useParams();
  const slug = params.slug;
  const navigate = useNavigate();

  const [publication] = createResource(slug, fetchPublication);

  // Redirect si l’article est privé et que l’utilisateur n’est pas connecté
  createEffect(() => {
    if (publication() && !publication().public && !isAuthenticated()) {
      navigate("/login");
    }
  });

  return (
    <Show when={publication()} fallback={<p>Loading...</p>}>
      <Show
        when={publication().public || isAuthenticated()}
        fallback={<p>Vous devez être connecté pour voir cette publication.</p>}
      >
        <h1>{publication().title}</h1>
        <p>{publication().content}</p>
      </Show>
    </Show>
  );
}
