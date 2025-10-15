import type {
  OrchestratorPayload,
  PublicationPayload,
  ContentPayload,
  SegmentWithMeta,
  IngredientPayload,
  PrepTimePayload,
  CategoryPayload,
  Action,
} from "@/types/payloadBuilder";

export class PayloadBuilder {
  build(
    action: Action,
    key: string,
    data: any,
    existing?: PublicationPayload,
  ): OrchestratorPayload {
    const publication = this.mapPublication(
      data,
      existing,
      action === "update",
    );
    return { action, payload: { [key]: publication } };
  }

  private mapPublication(
    data: any,
    existing?: PublicationPayload,
    isUpdate = false,
  ): PublicationPayload {
    return {
      publication_id: isUpdate ? existing?.publication_id : undefined,
      title: data.title ?? existing?.title ?? "Untitled",
      description: this.toArray(data.description ?? existing?.description),
      note: this.toArray(data.note ?? existing?.note ?? []),
      public: data.public ?? existing?.public ?? false,
      published: data.published ?? existing?.published ?? false,
      thumbnail: data.thumbnail ?? existing?.thumbnail,
      gallery: data.gallery ?? existing?.gallery,
      type: this.mapCategory(data.type ?? existing?.type, "Type"),
      style: this.mapCategory(data.style ?? existing?.style, "Style"),
      author: this.mapCategory(data.author ?? existing?.author, "Author"),
      tags: this.mapTags(data.tags ?? existing?.tags),
      contents: (data.contents ?? []).map((c: any, i: number) =>
        this.mapContent(c, existing?.contents?.[i], isUpdate),
      ),
    };
  }

  private mapContent(
    c: any,
    existing?: ContentPayload,
    isUpdate = false,
  ): ContentPayload {
    const servings = c.servings ?? existing?.servings ?? null;
    return {
      content_id: isUpdate ? existing?.content_id : undefined,
      total_prep_time:
        c.total_prep_time ?? existing?.total_prep_time ?? this.sumPrepTimes(c),
      servings:
        typeof servings === "object"
          ? servings
          : servings
            ? { yield: Number(servings), value: "" }
            : null,
      subtitle: c.subtitle ?? existing?.subtitle,
      is_ingredient: c.is_ingredient ?? existing?.is_ingredient ?? false,
      publication: c.publication ?? existing?.publication,
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
        segment_id: isUpdate ? existing?.segment?.segment_id : undefined,
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
      ingredient_id: isUpdate ? existing?.ingredient_id : undefined,
      quantity: Number(i.quantity ?? existing?.quantity ?? 0),
      multiply_factor: Number(
        i.multiply_factor ?? existing?.multiply_factor ?? 1,
      ),
      cut: i.cut ?? existing?.cut,
      title: i.title ?? existing?.title,
      product: {
        product_id: isUpdate
          ? (i.product?.product_id ?? existing?.product?.product_id)
          : i.product?.product_id,
        name: i.product?.name ?? existing?.product?.name ?? "",
        is_recipe:
          i.product?.is_recipe ?? existing?.product?.is_recipe ?? false,
        macro: i.product?.macro ?? existing?.product?.macro ?? null,
      },
      ingredient_units: (
        i.ingredient_units ??
        existing?.ingredient_units ??
        []
      ).map((u: any) => ({
        unit: { unit_id: u.unit?.unit_id, name: u.unit?.name ?? "" },
      })),
    };
  }

  private mapPrepTime(p: any, isUpdate = false): PrepTimePayload {
    return {
      prep_time_id: isUpdate ? p.prep_time_id : undefined,
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
    return Array.isArray(value) ? value : [String(value)];
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
