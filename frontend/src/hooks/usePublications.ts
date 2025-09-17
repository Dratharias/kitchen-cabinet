import { createCrudHooks } from "../lib/createCrudHooks";
import type { PublicationPayload, Publication } from "../types";
import { createResource } from "solid-js";
import { api } from "../lib/apiClient";

export const {
  useList: usePublications,
  useOne: usePublication,
  createOne: createPublication,
  updateOne: updatePublication,
  deleteOne: deletePublication,
} = createCrudHooks<PublicationPayload, Publication>({
  basePath: "/api/publications",
  key: "publication",
});

export function useDeepPublication(id: () => string) {
  const [data] = createResource(id, async (id) => {
    const pub = await api.get<Publication>(`/api/publications/${id}`);
    return pub;
  });
  return { data };
}
