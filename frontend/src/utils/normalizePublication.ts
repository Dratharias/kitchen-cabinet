import type { PublicationPayload } from "@/types/payloadBuilder";

type DynamicPublication = any;

export function normalizePublication(
  pub: DynamicPublication,
): PublicationPayload {
  return {
    publication_id: pub.publication_id,
    title: pub.title ?? "Untitled",
    description: pub.description ?? [],
    note: pub.note ?? [],
    public: pub.public ?? false,
    published: pub.published ?? false,
    thumbnail: pub.thumbnail ?? null,
    gallery: pub.gallery ?? [],
    type: pub.type,
    style: pub.style,
    author: pub.author,
    tags: pub.tags ?? [],
    contents: pub.contents ?? [],
  };
}
