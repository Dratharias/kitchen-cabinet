import { v4 as uuidv4 } from "uuid";
import { prisma } from "../config.js";
import type { PrismaClient } from "@prisma/client";
import type {
  OrchestratorRequest,
  OrchestratorResponse,
} from "../types/orchestrator.types.js";

const DEV_MODE = process.env.NODE_ENV !== "production";

function safeStringify(v: unknown, max = 2000): string {
  try {
    const s = JSON.stringify(v);
    return s.length > max ? s.slice(0, max) + "…(truncated)" : s;
  } catch {
    return "[unserializable]";
  }
}

class OrchestratorError extends Error {
  context: string;
  path?: string;
  payload?: unknown;

  constructor(
    message: string,
    context: string,
    path?: string,
    payload?: unknown,
  ) {
    super(message);
    this.name = "OrchestratorError";
    this.context = context;
    this.path = path;
    this.payload = payload;
  }
}

function logError(
  context: string,
  error: any,
  extra?: Record<string, unknown>,
) {
  console.error(`[Orchestrator] ${context} failed:`, {
    name: error?.name,
    message: error?.message,
    stack: error?.stack,
    extra,
  });
}

function assert(
  condition: any,
  message: string,
  context: string,
  path?: string,
  payload?: unknown,
): asserts condition {
  if (!condition) throw new OrchestratorError(message, context, path, payload);
}

export class OrchestratorController {
  private async safeId(
    tx: PrismaClient,
    table: keyof PrismaClient,
    idField: string,
    candidateId?: string,
  ): Promise<string> {
    if (!candidateId) return uuidv4();
    const exists = await (tx[table] as any).findUnique({
      where: { [idField]: candidateId },
    });
    return exists ? uuidv4() : candidateId;
  }

  public async processRequest(
    request: OrchestratorRequest,
  ): Promise<OrchestratorResponse> {
    const { action, payload } = request;

    if (action === "create") {
      try {
        const results = await prisma.$transaction(async (tx: any) => {
          const out: Record<string, unknown> = {};
          for (const key of Object.keys(payload || {})) {
            const publicationData = (payload as any)[key];
            try {
              assert(
                publicationData,
                "Missing publication payload",
                "processRequest",
                `payload.${key}`,
                publicationData,
              );
              const result = await this.processPublication(publicationData, tx);
              out[key] = result;
            } catch (e: any) {
              // Log with the per-key payload
              logError("processPublication", e, {
                key,
                payload: publicationData,
              });
              // Re-throw to abort transaction
              throw e;
            }
          }
          return out;
        });

        return { success: true, results: results as any };
      } catch (error: any) {
        logError("transaction", error, { payload });
        return {
          success: false,
          error: DEV_MODE
            ? `[transaction] ${error?.message || "Internal server error"}`
            : "Internal server error",
        };
      }
    }

    if (action === "readAll") {
      try {
        const [categories, products, units] = await prisma.$transaction([
          prisma.category.findMany(),
          prisma.product.findMany(),
          prisma.unit.findMany(),
        ]);
        return {
          success: true,
          results: { categories, products, units } as any,
        };
      } catch (error: any) {
        logError("readAll", error);
        return { success: false, error: "Internal server error" };
      }
    }

    return { success: false, error: `Action '${action}' not supported.` };
  }

  // ---- Publication ---------------------------------------------------------

  private async processPublication(publicationData: any, tx: PrismaClient) {
    const ctx = "processPublication";

    try {
      assert(
        publicationData?.title,
        "Publication.title is required",
        ctx,
        "title",
        publicationData,
      );

      // Optional categories
      const typeId = publicationData.type?.data?.str_value
        ? await this.processCategory(publicationData.type, "Type", tx, "type")
        : null;

      const styleId = publicationData.style?.data?.str_value
        ? await this.processCategory(
            publicationData.style,
            "Style",
            tx,
            "style",
          )
        : null;

      const authorId = publicationData.author?.data?.str_value
        ? await this.processCategory(
            publicationData.author,
            "Author",
            tx,
            "author",
          )
        : null;

      // Upsert publication
      const publicationId = await this.safeId(
        tx,
        "publication",
        "publication_id",
        publicationData.publication_id,
      );

      const publication = await tx.publication.upsert({
        where: { publication_id: publicationId },
        update: {
          title: publicationData.title,
          description: publicationData.description ?? [],
          note: publicationData.note ?? [],
          thumbnail: publicationData.thumbnail ?? null,
          gallery: publicationData.gallery ?? [],
          public: publicationData.public ?? true,
          published: publicationData.published ?? true,
          type_id: typeId,
          style_id: styleId,
          author_id: authorId,
        },
        create: {
          publication_id: publicationId,
          title: publicationData.title,
          description: publicationData.description ?? [],
          note: publicationData.note ?? [],
          thumbnail: publicationData.thumbnail ?? null,
          gallery: publicationData.gallery ?? [],
          public: publicationData.public ?? true,
          published: publicationData.published ?? true,
          type_id: typeId,
          style_id: styleId,
          author_id: authorId,
        },
      });

      // Tags
      if (publicationData.tags) {
        await tx.publication_tag.deleteMany({
          where: { publication_id: publication.publication_id },
        });
        for (let i = 0; i < publicationData.tags.length; i++) {
          const tagPayload = publicationData.tags[i];
          const tagId = await this.processCategory(
            tagPayload,
            "Tag",
            tx,
            `tags[${i}]`,
          );
          await tx.publication_tag.create({
            data: {
              publication_id: publication.publication_id,
              category_id: tagId,
            },
          });
        }
      }

      // Contents
      if (publicationData.contents) {
        for (let ci = 0; ci < publicationData.contents.length; ci++) {
          await this.processContent(
            publicationData.contents[ci],
            publication.publication_id,
            tx,
            `contents[${ci}]`,
          );
        }
      }

      return publication;
    } catch (err: any) {
      // Provide payload snippet in dev
      const extra = DEV_MODE
        ? { payload: safeStringify(publicationData) }
        : undefined;
      logError(ctx, err, extra);
      throw err;
    }
  }

  // ---- Content -------------------------------------------------------------

  private async processContent(
    contentPayload: any,
    publicationId: string,
    tx: PrismaClient,
    path = "content",
  ) {
    const ctx = "processContent";
    try {
      assert(
        contentPayload?.data,
        "Content.data is required",
        ctx,
        `${path}.data`,
        contentPayload,
      );
      assert(
        typeof contentPayload.data.total_prep_time === "number",
        "Content.data.total_prep_time must be a number",
        ctx,
        `${path}.data.total_prep_time`,
        contentPayload,
      );

      const contentId = await this.safeId(
        tx,
        "content",
        "content_id",
        contentPayload.content_id,
      );
      const content = await tx.content.upsert({
        where: { content_id: contentId },
        update: {
          total_prep_time: contentPayload.data.total_prep_time ?? 0,
          servings: contentPayload.data.servings ?? null,
          publication_id: publicationId,
        },
        create: {
          content_id: contentId,
          total_prep_time: contentPayload.data.total_prep_time ?? 0,
          servings: contentPayload.data.servings ?? null,
          publication_id: publicationId,
        },
      });

      // segments
      if (contentPayload.content_segments) {
        await tx.content_segment.deleteMany({
          where: { content_id: content.content_id },
        });
        for (let i = 0; i < contentPayload.content_segments.length; i++) {
          const segWrapper = contentPayload.content_segments[i];
          assert(
            segWrapper?.segment,
            "content_segments[i].segment is required",
            ctx,
            `${path}.content_segments[${i}]`,
            segWrapper,
          );
          const segmentId = await this.processSegment(
            segWrapper.segment,
            tx,
            `${path}.content_segments[${i}].segment`,
          );
          await tx.content_segment.create({
            data: {
              content_id: content.content_id,
              segment_id: segmentId,
              position: segWrapper.position ?? i + 1,
            },
          });
        }
      }

      // ingredients
      if (contentPayload.content_ingredients) {
        await tx.content_ingredient.deleteMany({
          where: { content_id: content.content_id },
        });
        for (let i = 0; i < contentPayload.content_ingredients.length; i++) {
          const ingPayload = contentPayload.content_ingredients[i];
          const ingredientId = await this.processIngredient(
            ingPayload,
            tx,
            `${path}.content_ingredients[${i}]`,
          );
          await tx.content_ingredient.create({
            data: {
              content_id: content.content_id,
              ingredient_id: ingredientId,
            },
          });
        }
      }

      // prep times
      if (contentPayload.content_prep_times) {
        await tx.content_prep_time.deleteMany({
          where: { content_id: content.content_id },
        });
        for (let i = 0; i < contentPayload.content_prep_times.length; i++) {
          const ptPayload = contentPayload.content_prep_times[i];
          const prepTimeId = await this.processPrepTime(
            ptPayload,
            tx,
            `${path}.content_prep_times[${i}]`,
          );
          await tx.content_prep_time.create({
            data: { content_id: content.content_id, prep_time_id: prepTimeId },
          });
        }
      }
    } catch (err: any) {
      const extra = DEV_MODE
        ? { path, payload: safeStringify(contentPayload) }
        : undefined;
      logError(ctx, err, extra);
      throw err;
    }
  }

  // ---- Category ------------------------------------------------------------

  private async processCategory(
    categoryPayload: any,
    type: string,
    tx: PrismaClient,
    path = "category",
  ): Promise<string> {
    const ctx = "processCategory";
    try {
      assert(
        categoryPayload?.data,
        "Category.data is required",
        ctx,
        `${path}.data`,
        categoryPayload,
      );
      const { str_value } = categoryPayload.data;
      assert(
        str_value,
        "Category.data.str_value is required",
        ctx,
        `${path}.data.str_value`,
        categoryPayload,
      );

      const existing = await tx.category.findUnique({
        where: { str_value_type: { str_value, type } },
      });
      if (existing) return existing.category_id;

      const categoryId = await this.safeId(
        tx,
        "category",
        "category_id",
        categoryPayload.category_id,
      );
      const category = await tx.category.create({
        data: { category_id: categoryId, str_value, type },
      });
      return category.category_id;
    } catch (err: any) {
      const extra = DEV_MODE
        ? { type, path, payload: safeStringify(categoryPayload) }
        : undefined;
      logError(ctx, err, extra);
      throw err;
    }
  }

  // ---- Segment -------------------------------------------------------------

  private async processSegment(
    segmentPayload: any,
    tx: PrismaClient,
    path = "segment",
  ): Promise<string> {
    const ctx = "processSegment";
    try {
      assert(
        segmentPayload?.data,
        "Segment.data is required",
        ctx,
        `${path}.data`,
        segmentPayload,
      );

      const { title, paragraph } = segmentPayload.data;
      assert(
        typeof paragraph === "string",
        "Segment.data.paragraph must be a string",
        ctx,
        `${path}.data.paragraph`,
        segmentPayload,
      );

      const existing = await tx.segment.findFirst({ where: { paragraph } });
      if (existing) {
        await tx.segment.update({
          where: { segment_id: existing.segment_id },
          data: {
            title: title ?? existing.title,
          },
        });
        return existing.segment_id;
      }

      const segmentId = await this.safeId(
        tx,
        "segment",
        "segment_id",
        segmentPayload.segment_id,
      );
      const segment = await tx.segment.create({
        data: {
          segment_id: segmentId,
          title: title ?? null,
          paragraph,
        },
      });
      return segment.segment_id;
    } catch (err: any) {
      const extra = DEV_MODE
        ? { path, payload: safeStringify(segmentPayload) }
        : undefined;
      logError(ctx, err, extra);
      throw err;
    }
  }

  // ---- Product -------------------------------------------------------------

  private async processProduct(
    productPayload: any,
    tx: PrismaClient,
    path = "product",
  ): Promise<string> {
    const ctx = "processProduct";
    try {
      assert(productPayload, "Product payload is required", ctx, path);
      // connect by id
      if (productPayload.id) return productPayload.id;

      // create by data
      assert(
        productPayload.data,
        "Product.data is required when id is missing",
        ctx,
        `${path}.data`,
        productPayload,
      );
      const { name, en_name, publication } = productPayload.data;
      assert(
        name,
        "Product.data.name is required",
        ctx,
        `${path}.data.name`,
        productPayload,
      );

      const existing = await tx.product.findUnique({ where: { name } });
      if (existing) return existing.product_id;

      const productId = await this.safeId(
        tx,
        "product",
        "product_id",
        productPayload.product_id,
      );
      await tx.product.create({
        data: {
          product_id: productId,
          name,
          en_name: en_name || name,
          is_recipe_id: publication?.id || null,
        },
      });
      return productId;
    } catch (err: any) {
      const extra = DEV_MODE
        ? { path, payload: safeStringify(productPayload) }
        : undefined;
      logError(ctx, err, extra);
      throw err;
    }
  }

  // ---- Ingredient ----------------------------------------------------------

  private async processIngredient(
    ingredientPayload: any,
    tx: PrismaClient,
    path = "ingredient",
  ): Promise<string> {
    const ctx = "processIngredient";
    try {
      assert(
        ingredientPayload?.data,
        "Ingredient.data is required",
        ctx,
        `${path}.data`,
        ingredientPayload,
      );

      const productId = await this.processProduct(
        ingredientPayload.product,
        tx,
        `${path}.product`,
      );
      const ingredientId = await this.safeId(
        tx,
        "ingredient",
        "ingredient_id",
        ingredientPayload.ingredient_id,
      );

      const ingredient = await tx.ingredient.upsert({
        where: { ingredient_id: ingredientId },
        update: {
          quantity: ingredientPayload.data?.quantity ?? 0,
          multiply_factor: ingredientPayload.data?.multiply_factor ?? 1,
          product_id: productId,
        },
        create: {
          ingredient_id: ingredientId,
          quantity: ingredientPayload.data?.quantity ?? 0,
          multiply_factor: ingredientPayload.data?.multiply_factor ?? 1,
          product_id: productId,
        },
      });

      // Units
      if (ingredientPayload.ingredient_units?.length) {
        await tx.ingredient_unit.deleteMany({
          where: { ingredient_id: ingredient.ingredient_id },
        });

        for (let i = 0; i < ingredientPayload.ingredient_units.length; i++) {
          const unitWrap = ingredientPayload.ingredient_units[i];
          const unitId = await this.processUnit(
            unitWrap?.unit,
            tx,
            `${path}.ingredient_units[${i}].unit`,
          );
          await tx.ingredient_unit.create({
            data: { ingredient_id: ingredient.ingredient_id, unit_id: unitId },
          });
        }
      }

      return ingredient.ingredient_id;
    } catch (err: any) {
      const extra = DEV_MODE
        ? { path, payload: safeStringify(ingredientPayload) }
        : undefined;
      logError(ctx, err, extra);
      throw err;
    }
  }

  // ---- Unit ----------------------------------------------------------------

  private async processUnit(
    unitPayload: any,
    tx: PrismaClient,
    path = "unit",
  ): Promise<string> {
    const ctx = "processUnit";
    try {
      assert(unitPayload, "Unit payload is required", ctx, path);
      // connect
      if (unitPayload.id) return unitPayload.id;

      // create
      const name = unitPayload?.data?.name;
      assert(
        name,
        "Unit.data.name is required when id is missing",
        ctx,
        `${path}.data.name`,
        unitPayload,
      );

      const existing = await tx.unit.findUnique({ where: { name } });
      if (existing) return existing.unit_id;

      const unitId = await this.safeId(
        tx,
        "unit",
        "unit_id",
        unitPayload.unit_id,
      );
      const unit = await tx.unit.create({ data: { unit_id: unitId, name } });
      return unit.unit_id;
    } catch (err: any) {
      const extra = DEV_MODE
        ? { path, payload: safeStringify(unitPayload) }
        : undefined;
      logError(ctx, err, extra);
      throw err;
    }
  }

  // ---- Prep Time -----------------------------------------------------------

  private async processPrepTime(
    prepTimePayload: any,
    tx: PrismaClient,
    path = "prep_time",
  ): Promise<string> {
    const ctx = "processPrepTime";
    try {
      const duration =
        prepTimePayload?.data?.duration ??
        prepTimePayload?.duration ??
        prepTimePayload?.prep_time?.data?.duration ??
        prepTimePayload?.prep_time?.duration;

      assert(
        Number.isFinite(duration),
        "PrepTime.duration is required (number)",
        ctx,
        `${path}.data.duration`,
        prepTimePayload,
      );

      const styleId = prepTimePayload?.style?.data?.str_value
        ? await this.processCategory(
            prepTimePayload.style,
            "Cook",
            tx,
            `${path}.style`,
          )
        : null;

      const prepTimeId = await this.safeId(
        tx,
        "prep_time",
        "prep_time_id",
        prepTimePayload?.prep_time_id ||
          prepTimePayload?.prep_time?.prep_time_id,
      );

      const pt = await tx.prep_time.upsert({
        where: { prep_time_id: prepTimeId },
        update: { duration, style_id: styleId },
        create: { prep_time_id: prepTimeId, duration, style_id: styleId },
      });

      return pt.prep_time_id;
    } catch (err: any) {
      const extra = DEV_MODE
        ? { path, payload: safeStringify(prepTimePayload) }
        : undefined;
      logError(ctx, err, extra);
      throw err;
    }
  }
}
