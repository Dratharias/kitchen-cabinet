import {
  PublicationPayload,
  OrchestratorPayload,
  ContentPayload,
  IngredientPayload,
  PrepTimePayload,
  CategoryPayload,
  OrchestratorAction,
  Servings,
  Segment,
  Publication,
  Content,
  Category,
} from "@/types";

interface SegmentWithMeta {
  position: number;
  segment: Partial<Segment>;
  segment_prep_time?: { prep_time: Partial<PrepTimePayload> }[];
}

export class PayloadBuilder {
  build(
    action: OrchestratorAction,
    key: string,
    data: any,
    existing?: Publication,
  ): OrchestratorPayload {
    const publication = this.mapPublication(
      data,
      existing,
      action === "update",
    );
    return { action, payload: { publications: { [key]: publication } } };
  }

  private mapPublication(
    data: any,
    existing?: Publication,
    isUpdate = false,
  ): PublicationPayload {
    const descriptionLines = this.toArray(
      data.description ?? existing?.description,
    );

    return {
      ...(isUpdate && existing?.publication_id
        ? { publication_id: existing.publication_id }
        : {}),
      title: data.title ?? existing?.title ?? "Untitled",
      description: descriptionLines.filter((line) => line.trim() !== ""),
      note: this.toArray(data.note ?? existing?.note ?? []).filter(
        (line) => line.trim() !== "",
      ),
      public: data.public ?? existing?.public ?? false,
      published: data.published ?? existing?.published ?? false,
      thumbnail: data.thumbnail ?? existing?.thumbnail,
      type_id: data.type?.category_id ?? existing?.type_id,
      style_id: data.style?.category_id ?? existing?.style_id,
      author_id: data.author?.category_id ?? existing?.author_id,
      tags: this.mapTags(data.tags ?? existing?.tags),
      contents: (data.contents ?? []).map((c: any, i: number) =>
        this.mapContent(c, existing?.contents?.[i], isUpdate),
      ),
    };
  }

  private mapContent(
    c: any,
    existing?: Content,
    isUpdate = false,
  ): ContentPayload {
    const rawServings = c.servings ?? existing?.servings ?? null;
    let mappedServings: Servings | null = null;

    if (rawServings) {
      if (typeof rawServings === "object" && rawServings.yield !== undefined) {
        mappedServings = rawServings;
      } else if (
        typeof rawServings === "number" ||
        (typeof rawServings === "string" && !isNaN(Number(rawServings)))
      ) {
        mappedServings = {
          yield: Number(rawServings),
          value: "",
        };
      }
    }

    return {
      ...(isUpdate && existing?.content_id
        ? { content_id: existing.content_id }
        : {}),
      total_prep_time:
        c.total_prep_time ?? existing?.total_prep_time ?? this.sumPrepTimes(c),
      servings: mappedServings,
      subtitle: c.subtitle ?? existing?.subtitle,
      is_ingredient: c.is_ingredient ?? existing?.is_ingredient ?? false,
      publication_id: c.publication_id ?? existing?.publication_id,
      gallery: c.gallery ?? existing?.gallery,
      content_segments: (c.content_segments ?? []).map((s: any, i: number) =>
        this.mapSegment(s, existing?.content_segments?.[i], isUpdate, i + 1),
      ),
      content_ingredients: (c.content_ingredients ?? []).map(
        (i: any, n: number) =>
          this.mapIngredient(i, existing?.content_ingredients?.[n], isUpdate),
      ),
      content_prep_times: (c.content_prep_times ?? []).map((p: any) =>
        this.mapPrepTime(p, isUpdate),
      ),
    };
  }

  private mapSegment(
    s: any,
    existing?: SegmentWithMeta,
    isUpdate = false,
    position = 1,
  ): SegmentWithMeta {
    return {
      position,
      segment: {
        ...(isUpdate && existing?.segment?.segment_id
          ? { segment_id: existing.segment.segment_id }
          : {}),
        title: s.segment?.title ?? existing?.segment?.title ?? "",
        paragraph: s.segment?.paragraph ?? existing?.segment?.paragraph ?? "",
      },
      segment_prep_time: (s.segment_prep_time ?? []).map((p: any) => ({
        prep_time: this.mapPrepTime(p.prep_time ?? p, isUpdate),
      })),
    };
  }

  private mapIngredient(
    i: any,
    existing?: IngredientPayload,
    isUpdate = false,
  ): IngredientPayload {
    return {
      ...(isUpdate && i.ingredient_id
        ? { ingredient_id: i.ingredient_id }
        : {}),
      quantity: Number(i.quantity ?? existing?.quantity ?? 0),
      multiply_factor: Number(
        i.multiply_factor ?? existing?.multiply_factor ?? 1,
      ),
      cut: i.cut ?? existing?.cut,
      title: i.title ?? existing?.title,
      product: {
        ...(isUpdate && i.product?.product_id
          ? { product_id: i.product.product_id }
          : {}),
        name: i.product?.name ?? existing?.product?.name ?? "",
        is_recipe_id:
          i.product?.is_recipe_id ?? existing?.product?.is_recipe_id ?? null,
        macro: i.product?.macro ?? existing?.product?.macro ?? null,
      },
      ingredient_units: (
        i.ingredient_units ??
        existing?.ingredient_units ??
        []
      ).map((u: any) => ({
        name: u.unit?.name ?? "",
        ...(u.unit?.unit_id ? { unit_id: u.unit.unit_id } : {}),
      })),
    };
  }

  private mapPrepTime(p: any, isUpdate = false): PrepTimePayload {
    return {
      ...(isUpdate && p.prep_time_id ? { prep_time_id: p.prep_time_id } : {}),
      duration: Number(p.duration ?? 0),
      style: p.style
        ? {
            str_value: p.style.str_value ?? p.style,
            type: p.style.type ?? "PrepStyle",
          }
        : undefined,
    };
  }

  private mapCategory(
    data: any,
    defaultType: string,
  ): CategoryPayload | undefined {
    if (!data) return undefined;
    if (typeof data === "string") return { str_value: data, type: defaultType };
    if (typeof data === "object" && data.str_value)
      return { str_value: data.str_value, type: data.type ?? defaultType };
    return undefined;
  }

  private mapTags(tags?: any[]): CategoryPayload[] | undefined {
    if (!Array.isArray(tags)) return undefined;
    return tags.map((t) =>
      typeof t === "string"
        ? { str_value: t, type: "Tag" }
        : { str_value: t.str_value, type: "Tag" },
    );
  }

  private toArray(value: unknown): string[] {
    if (!value) return [];
    if (Array.isArray(value)) {
      return value.filter((s) => typeof s === "string") as string[];
    }
    if (typeof value === "string") {
      return value.split("\n");
    }
    return [];
  }

  private sumPrepTimes(c: any): number {
    const prepTimes = c?.content_prep_times ?? [];
    if (!Array.isArray(prepTimes)) return 0;
    return prepTimes.reduce(
      (sum: number, p: any) => sum + Number(p.duration ?? 0),
      0,
    );
  }
}
