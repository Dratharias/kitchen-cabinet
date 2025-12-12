import type { Publication, PublicationPayload } from "../types";

/**
 * Converts a Publication object from the API into a format suitable for the form state.
 * Specifically, it joins array-based text fields into newline-separated strings
 * and flattens segment structures for form editing.
 */
export function normalizePublicationToForm(pub: Publication): any {
  if (!pub) return null;

  // Transform contents to match form structure
  const contents = pub.contents?.map((content: any) => {
    // Transform content_segments to flat segments
    const segments = content.content_segments?.map((cs: any) => ({
      position: cs.position,
      title: cs.segment?.title || "",
      paragraph: cs.segment?.paragraph || "",
      note: cs.segment?.note || "",
      section: cs.segment?.section || null,
    })) || [];

    // Transform content_ingredients to ingredients
    const ingredients = content.content_ingredients?.map((ci: any) => ({
      ...ci.ingredient,
      position: ci.position || 0,
    })) || [];

    return {
      ...content,
      segments,
      ingredients,
    };
  });

  return {
    ...pub,
    description: (pub.description || []).join("\n"),
    note: (pub.note || []).join("\n"),
    contents,
  };
}

/**
 * Converts form data back into a PublicationPayload suitable for the orchestrator.
 * It splits newline-separated strings back into arrays.
 */
export function denormalizeFormToPublication(
  formData: any,
  originalPublication: Publication,
): PublicationPayload {
  return {
    ...formData,
    publication_id: originalPublication.publication_id,
    description: formData.description ? formData.description.split("\n") : [],
    note: formData.note ? formData.note.split("\n") : [],
  };
}
