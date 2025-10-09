import { v4 as uuidv4 } from "uuid";
import { prisma } from "../config.js";
import type { PrismaClient } from "@prisma/client";
import type {
  OrchestratorRequest,
  OrchestratorResponse,
} from "../types/orchestrator.types.js";

const DEV_MODE = process.env.NODE_ENV !== "production";

/* -------------------- util -------------------- */
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

/* ============================================================
   OrchestratorController
   ============================================================ */
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
    req: OrchestratorRequest,
  ): Promise<OrchestratorResponse> {
    const { action, payload } = req;

    if (action === "create" || action === "update") {
      try {
        const results = await prisma.$transaction(async (tx: any) => {
          const out: Record<string, unknown> = {};
          for (const key of Object.keys(payload || {})) {
            const publication = (payload as any)[key];
            assert(
              publication,
              "Missing publication payload",
              "processRequest",
              `payload.${key}`,
              publication,
            );

            const res =
              action === "create"
                ? await this.createPublication(publication, tx)
                : await this.updatePublication(publication, tx);

            out[key] = res;
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

  /* -------------------- publication -------------------- */
  private async createPublication(pub: any, tx: PrismaClient) {
    const ctx = "createPublication";
    assert(pub?.title, "Publication.title is required", ctx, "title", pub);

    const publication_id = await this.safeId(
      tx,
      "publication",
      "publication_id",
      pub.publication_id,
    );

    const type_id = await this.processCategory(
      pub.type,
      tx,
      "Type",
      `${ctx}.type`,
    );
    const style_id = await this.processCategory(
      pub.style,
      tx,
      "Style",
      `${ctx}.style`,
    );
    const author_id = await this.processCategory(
      pub.author,
      tx,
      "Author",
      `${ctx}.author`,
    );

    const created = await tx.publication.create({
      data: {
        publication_id,
        title: pub.title,
        description: Array.isArray(pub.description) ? pub.description : [],
        note: Array.isArray(pub.note) ? pub.note : [],
        public: typeof pub.public === "boolean" ? pub.public : true,
        published: typeof pub.published === "boolean" ? pub.published : true,
        thumbnail: pub.thumbnail ?? null,
        gallery: Array.isArray(pub.gallery) ? pub.gallery : [],
        type_id,
        style_id,
        author_id,
      },
    });

    if (Array.isArray(pub.tags)) {
      for (let i = 0; i < pub.tags.length; i++) {
        const tagId = await this.processCategory(
          pub.tags[i],
          tx,
          "Tag",
          `tags[${i}]`,
        );
        if (!tagId) continue;
        await tx.publication_tag.create({
          data: { publication_id: created.publication_id, category_id: tagId },
        });
      }
    }

    if (Array.isArray(pub.contents)) {
      for (let i = 0; i < pub.contents.length; i++) {
        await this.processContent(
          pub.contents[i],
          created.publication_id,
          tx,
          `contents[${i}]`,
        );
      }
    }

    return created;
  }

  private async updatePublication(pub: any, tx: PrismaClient) {
    const ctx = "updatePublication";
    assert(
      pub?.publication_id,
      "Missing publication_id for update",
      ctx,
      "publication_id",
      pub,
    );

    const type_id = await this.processCategory(
      pub.type,
      tx,
      "Type",
      `${ctx}.type`,
    );
    const style_id = await this.processCategory(
      pub.style,
      tx,
      "Style",
      `${ctx}.style`,
    );
    const author_id = await this.processCategory(
      pub.author,
      tx,
      "Author",
      `${ctx}.author`,
    );

    const updated = await tx.publication.update({
      where: { publication_id: pub.publication_id },
      data: {
        title: pub.title,
        description: Array.isArray(pub.description) ? pub.description : [],
        note: Array.isArray(pub.note) ? pub.note : [],
        public: typeof pub.public === "boolean" ? pub.public : true,
        published: typeof pub.published === "boolean" ? pub.published : true,
        thumbnail: pub.thumbnail ?? null,
        gallery: Array.isArray(pub.gallery) ? pub.gallery : [],
        type_id,
        style_id,
        author_id,
      },
    });

    await tx.publication_tag.deleteMany({
      where: { publication_id: updated.publication_id },
    });
    if (Array.isArray(pub.tags)) {
      for (let i = 0; i < pub.tags.length; i++) {
        const tagId = await this.processCategory(
          pub.tags[i],
          tx,
          "Tag",
          `tags[${i}]`,
        );
        if (!tagId) continue;
        await tx.publication_tag.create({
          data: { publication_id: updated.publication_id, category_id: tagId },
        });
      }
    }

    // reset contents (cascade on junctions is enabled)
    await tx.content.deleteMany({
      where: { publication_id: updated.publication_id },
    });
    if (Array.isArray(pub.contents)) {
      for (let i = 0; i < pub.contents.length; i++) {
        await this.processContent(
          pub.contents[i],
          updated.publication_id,
          tx,
          `contents[${i}]`,
        );
      }
    }

    return updated;
  }

  /* -------------------- content (flat) -------------------- */
  private async processContent(
    content: any,
    publicationId: string,
    tx: PrismaClient,
    path = "content",
  ) {
    const ctx = "processContent";
    try {
      assert(
        content && typeof content === "object",
        "Invalid content payload",
        ctx,
        path,
        content,
      );

      const content_id = await this.safeId(
        tx,
        "content",
        "content_id",
        content.content_id,
      );

      const created = await tx.content.create({
        data: {
          content_id,
          publication_id: publicationId,
          total_prep_time: Number.isFinite(content.total_prep_time)
            ? content.total_prep_time
            : 0,
          servings:
            typeof content.servings === "number" || content.servings === null
              ? content.servings
              : null,
          subtitle:
            typeof content.subtitle === "string" ? content.subtitle : null,
          is_ingredient:
            typeof content.is_ingredient === "boolean"
              ? content.is_ingredient
              : false,
        },
      });

      // segments
      if (Array.isArray(content.content_segments)) {
        for (let i = 0; i < content.content_segments.length; i++) {
          const wrap = content.content_segments[i];
          const seg = wrap?.segment;
          if (!seg) continue;
          const segment_id = await this.processSegment(
            seg,
            tx,
            `${path}.content_segments[${i}].segment`,
          );
          await tx.content_segment.create({
            data: {
              content_id: created.content_id,
              segment_id,
              position: wrap?.position ?? i + 1,
            },
          });
        }
      }

      // ingredients
      if (Array.isArray(content.content_ingredients)) {
        for (let i = 0; i < content.content_ingredients.length; i++) {
          const ing_id = await this.processIngredient(
            content.content_ingredients[i],
            tx,
            `${path}.content_ingredients[${i}]`,
          );
          await tx.content_ingredient.create({
            data: { content_id: created.content_id, ingredient_id: ing_id },
          });
        }
      }

      // prep times
      if (Array.isArray(content.content_prep_times)) {
        for (let i = 0; i < content.content_prep_times.length; i++) {
          const pt_id = await this.processPrepTime(
            content.content_prep_times[i],
            tx,
            `${path}.content_prep_times[${i}]`,
          );
          await tx.content_prep_time.create({
            data: { content_id: created.content_id, prep_time_id: pt_id },
          });
        }
      }

      return created;
    } catch (err: any) {
      logError(ctx, err, DEV_MODE ? { path, payload: content } : undefined);
      throw err;
    }
  }

  /* -------------------- category/product/unit/segment/preptime (flat) -------------------- */
  private async processCategory(
    cat: any,
    tx: PrismaClient,
    fallbackType: string,
    path = "category",
  ): Promise<string | null> {
    if (!cat) return null;
    const str_value = (cat.str_value ?? cat.name ?? cat.value ?? "")
      .toString()
      .trim();
    const type = (cat.type ?? fallbackType ?? "").toString().trim();
    if (!str_value || !type) return null;

    const existing = await tx.category.findUnique({
      where: { str_value_type: { str_value, type } },
    });
    if (existing) return existing.category_id;

    const category_id = uuidv4();
    const created = await tx.category.create({
      data: { category_id, str_value, type },
    });
    return created.category_id;
  }

  private async processProduct(
    prod: any,
    tx: PrismaClient,
    path = "product",
  ): Promise<string> {
    assert(prod, "Product payload missing", "processProduct", path, prod);
    const name = (prod.name ?? "").toString().trim();
    assert(
      name,
      "Product.name is required",
      "processProduct",
      `${path}.name`,
      prod,
    );

    const existing = await tx.product.findUnique({ where: { name } });
    if (existing) return existing.product_id;

    const product_id = uuidv4();
    const created = await tx.product.create({
      data: { product_id, name, en_name: name },
    });
    return created.product_id;
  }

  private async processUnit(
    unit: any,
    tx: PrismaClient,
    path = "unit",
  ): Promise<string> {
    assert(unit, "Unit payload missing", "processUnit", path, unit);
    const name = (unit.name ?? "").toString().trim();
    assert(name, "Unit.name is required", "processUnit", `${path}.name`, unit);

    const existing = await tx.unit.findUnique({ where: { name } });
    if (existing) return existing.unit_id;

    const unit_id = uuidv4();
    const created = await tx.unit.create({ data: { unit_id, name } });
    return created.unit_id;
  }

  private async processIngredient(
    ing: any,
    tx: PrismaClient,
    path = "ingredient",
  ): Promise<string> {
    assert(ing, "Ingredient payload missing", "processIngredient", path, ing);
    const product_id = await this.processProduct(
      ing.product,
      tx,
      `${path}.product`,
    );

    const ingredient_id = uuidv4();
    const created = await tx.ingredient.create({
      data: {
        ingredient_id,
        quantity: typeof ing.quantity === "number" ? ing.quantity : null,
        multiply_factor: Number.isFinite(ing.multiply_factor)
          ? ing.multiply_factor
          : 1,
        cut: ing.cut ?? null,
        title: ing.title ?? null,
        product_id,
      },
    });

    if (Array.isArray(ing.ingredient_units)) {
      for (let i = 0; i < ing.ingredient_units.length; i++) {
        const unitId = await this.processUnit(
          ing.ingredient_units[i]?.unit,
          tx,
          `${path}.ingredient_units[${i}].unit`,
        );
        await tx.ingredient_unit.create({
          data: { ingredient_id: created.ingredient_id, unit_id: unitId },
        });
      }
    }

    return created.ingredient_id;
  }

  private async processSegment(
    seg: any,
    tx: PrismaClient,
    path = "segment",
  ): Promise<string> {
    assert(seg, "Segment payload missing", "processSegment", path, seg);
    const paragraph = (seg.paragraph ?? "").toString().trim();
    assert(
      paragraph,
      "Segment.paragraph is required",
      "processSegment",
      `${path}.paragraph`,
      seg,
    );

    const existing = await tx.segment.findFirst({ where: { paragraph } });
    if (existing) {
      // Optionally update title if provided
      if (typeof seg.title === "string" && seg.title !== existing.title) {
        await tx.segment.update({
          where: { segment_id: existing.segment_id },
          data: { title: seg.title },
        });
      }
      return existing.segment_id;
    }

    const segment_id = uuidv4();
    const created = await tx.segment.create({
      data: { segment_id, paragraph, title: seg.title ?? null },
    });
    return created.segment_id;
  }

  private async processPrepTime(
    pt: any,
    tx: PrismaClient,
    path = "prep_time",
  ): Promise<string> {
    assert(pt, "PrepTime payload missing", "processPrepTime", path, pt);
    const duration = Number(pt.duration);
    assert(
      Number.isFinite(duration),
      "PrepTime.duration is required (number)",
      "processPrepTime",
      `${path}.duration`,
      pt,
    );

    let style_id: string | null = null;
    if (pt.style) {
      style_id = await this.processCategory(
        pt.style,
        tx,
        "Cook",
        `${path}.style`,
      );
    }

    const prep_time_id = uuidv4();
    const created = await tx.prep_time.create({
      data: { prep_time_id, duration, style_id },
    });
    return created.prep_time_id;
  }
}
