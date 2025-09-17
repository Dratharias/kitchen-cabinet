// lib/createCrudHooks.ts
import { createResource } from "solid-js";
import { api } from "./apiClient";
import type { UUID, PaginatedRequest, PaginatedResponse } from "../types";

interface CrudConfig<TPayload, TEntity> {
  basePath: string;
  key: string; // "publication", "product", etc.
  withPagination?: boolean;
}

export function createCrudHooks<TPayload, TEntity>(
  config: CrudConfig<TPayload, TEntity>
) {
  function useList(params?: () => PaginatedRequest) {
    const [data, { refetch }] = createResource(params, (p) => {
      const query = p
        ? `?skip=${p.skip ?? 0}&take=${p.take ?? 12}`
        : "";
      return api.get<PaginatedResponse<TEntity>>(`${config.basePath}${query}`);
    });
    return { data, refetch };
  }

  function useOne(id: () => UUID) {
    const [data, { refetch }] = createResource(id, (id) =>
      api.get<TEntity>(`${config.basePath}/${id}`)
    );
    return { data, refetch };
  }

  function createOne() {
    return (payload: TPayload) =>
      api.post<TEntity>(config.basePath, payload);
  }

  function updateOne() {
    return (id: UUID, payload: Partial<TPayload>) =>
      api.put<TEntity>(`${config.basePath}/${id}`, payload);
  }

  function deleteOne() {
    return (id: UUID) =>
      api.del<{ success: boolean }>(`${config.basePath}/${id}`);
  }

  return {
    useList,
    useOne,
    createOne,
    updateOne,
    deleteOne,
  };
}
