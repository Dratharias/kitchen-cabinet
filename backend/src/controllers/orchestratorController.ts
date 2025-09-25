import { v4 as uuidv4 } from "uuid";
import { prisma } from "../config.js";
import {
  OrchestratorRequest,
  OrchestratorResponse,
} from "../types/orchestrator.types.js";
import { PrismaClient } from "@prisma/client";

function logError(context: string, error: any) {
  console.error(`[Orchestrator] ${context} failed:`, {
    message: error.message,
    stack: error.stack,
  });
}

export class OrchestratorController {
  // 🔹 Utility to ensure ID safety
  private async safeId(
    tx: PrismaClient,
    table: keyof PrismaClient,
    idField: string,
    candidateId?: string
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
        const results = await prisma.$transaction(async (tx) => {
          const resultsMap: any = {};
          for (const key in payload) {
            try {
              const publicationData = payload[key];
              const processedResult = await this.processPublication(
                publicationData,
                tx as any,
              );
              resultsMap[key] = processedResult;
            } catch (err) {
              logError("processPublication", err);
              throw err;
            }
          }
          return resultsMap;
        });
        return { success: true, results };
      } catch (error: any) {
        logError("transaction", error);
        return { success: false, error: "Internal server error" };
      }
    } else if (action === "readAll") {
      try {
        const [categories, products, units] = await prisma.$transaction([
          prisma.category.findMany(),
          prisma.product.findMany(),
          prisma.unit.findMany(),
        ]);
        return { success: true, results: { categories, products, units } };
      } catch (error: any) {
        logError("readAll", error);
        return { success: false, error: "Internal server error" };
      }
    } else {
      return { success: false, error: `Action '${action}' not supported.` };
    }
  }

  private async processPublication(
    publicationData: any,
    tx: PrismaClient,
  ): Promise<any> {
    try {
      const typeId = publicationData.type?.data?.str_value
        ? await this.processCategory(publicationData.type, "Type", tx)
        : null;
      const styleId = publicationData.style?.data?.str_value
        ? await this.processCategory(publicationData.style, "Style", tx)
        : null;
      const authorId = publicationData.author?.data?.str_value
        ? await this.processCategory(publicationData.author, "Author", tx)
        : null;

      const publicationId = await this.safeId(
        tx,
        "publication",
        "publication_id",
        publicationData.publication_id
      );

      const publication = await tx.publication.upsert({
        where: { publication_id: publicationId },
        update: {
          title: publicationData.title,
          description: publicationData.description,
          note: publicationData.note,
          thumbnail: publicationData.thumbnail,
          public: publicationData.public,
          published: publicationData.published,
          type_id: typeId,
          style_id: styleId,
          author_id: authorId,
        },
        create: {
          publication_id: publicationId,
          title: publicationData.title,
          description: publicationData.description,
          note: publicationData.note,
          thumbnail: publicationData.thumbnail,
          public: publicationData.public ?? true,
          published: publicationData.published ?? true,
          type_id: typeId,
          style_id: styleId,
          author_id: authorId,
        },
      });

      if (publicationData.tags) {
        await tx.publication_tag.deleteMany({
          where: { publication_id: publication.publication_id },
        });
        
        for (const tagPayload of publicationData.tags) {
          const categoryId = await this.processCategory(tagPayload, "Tag", tx);
          await tx.publication_tag.create({
            data: { publication_id: publication.publication_id, category_id: categoryId },
          });
        }
      }

      if (publicationData.contents) {
        for (const contentPayload of publicationData.contents) {
          await this.processContent(contentPayload, publication.publication_id, tx);
        }
      }

      return publication;
    } catch (err) {
      logError("processPublication", err);
      throw err;
    }
  }

  private async processContent(
    contentPayload: any,
    publicationId: string,
    tx: PrismaClient,
  ): Promise<void> {
    try {
      const contentId = await this.safeId(
        tx,
        "content",
        "content_id",
        contentPayload.content_id
      );

      const content = await tx.content.upsert({
        where: { content_id: contentId },
        update: {
          total_prep_time: contentPayload.data.total_prep_time,
          servings: contentPayload.data.servings,
          publication_id: publicationId,
        },
        create: {
          content_id: contentId,
          total_prep_time: contentPayload.data.total_prep_time,
          servings: contentPayload.data.servings,
          publication_id: publicationId,
        },
      });

      if (contentPayload.content_segments) {
        await tx.content_segment.deleteMany({
          where: { content_id: content.content_id },
        });

        for (const segmentPayload of contentPayload.content_segments) {
          const segmentId = await this.processSegment(segmentPayload.segment, tx);
          await tx.content_segment.create({
            data: { content_id: content.content_id, segment_id: segmentId, position: segmentPayload.position },
          });
        }
      }

      if (contentPayload.content_ingredients) {
        await tx.content_ingredient.deleteMany({
          where: { content_id: content.content_id },
        });

        for (const ingredientPayload of contentPayload.content_ingredients) {
          const ingredientId = await this.processIngredient(ingredientPayload, tx);
          await tx.content_ingredient.create({
            data: { content_id: content.content_id, ingredient_id: ingredientId },
          });
        }
      }

      if (contentPayload.content_prep_times) {
        await tx.content_prep_time.deleteMany({
          where: { content_id: content.content_id },
        });

        for (const prepTimePayload of contentPayload.content_prep_times) {
          const prepTimeId = await this.processPrepTime(prepTimePayload, tx);
          await tx.content_prep_time.create({
            data: { content_id: content.content_id, prep_time_id: prepTimeId },
          });
        }
      }
    } catch (err) {
      logError("processContent", err);
      throw err;
    }
  }

  private async processCategory(categoryPayload: any, type: string, tx: PrismaClient): Promise<string> {
    const { str_value } = categoryPayload.data;
    const existing = await tx.category.findUnique({
      where: { str_value_type: { str_value, type } },
    });
    if (existing) return existing.category_id;

    const categoryId = await this.safeId(tx, "category", "category_id", categoryPayload.category_id);
    const category = await tx.category.create({
      data: { category_id: categoryId, str_value, type },
    });
    return category.category_id;
  }

  private async processSegment(segmentPayload: any, tx: PrismaClient): Promise<string> {
    const { title, paragraph, order_num } = segmentPayload.data;

    const existing = await tx.segment.findFirst({ where: { paragraph } });
    if (existing) {
      await tx.segment.update({
        where: { segment_id: existing.segment_id },
        data: { title, order_num },
      });
      return existing.segment_id;
    }

    const segmentId = await this.safeId(tx, "segment", "segment_id", segmentPayload.segment_id);
    const segment = await tx.segment.create({
      data: { segment_id: segmentId, title, paragraph, order_num },
    });
    return segment.segment_id;
  }

  private async processProduct(productPayload: any, tx: PrismaClient): Promise<string> {
    if (productPayload.id) return productPayload.id;

    if (productPayload.data?.name) {
      const { name, en_name, publication } = productPayload.data;
      const existing = await tx.product.findUnique({ where: { name } });
      if (existing) return existing.product_id;

      const productId = await this.safeId(tx, "product", "product_id", productPayload.product_id);
      await tx.product.create({
        data: {
          product_id: productId,
          name,
          en_name: en_name || name,
          is_recipe_id: publication?.id || null,
        },
      });
      return productId;
    }
    throw new Error("Invalid product payload: missing id or data.name");
  }

  private async processIngredient(ingredientPayload: any, tx: PrismaClient): Promise<string> {
    const productId = await this.processProduct(ingredientPayload.product, tx);
    const ingredientId = await this.safeId(tx, "ingredient", "ingredient_id", ingredientPayload.ingredient_id);

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

    if (ingredientPayload.ingredient_units?.length) {
      await tx.ingredient_unit.deleteMany({ where: { ingredient_id: ingredient.ingredient_id } });
      for (const unitPayload of ingredientPayload.ingredient_units) {
        const unitId = await this.processUnit(unitPayload.unit, tx);
        await tx.ingredient_unit.create({
          data: { ingredient_id: ingredient.ingredient_id, unit_id: unitId },
        });
      }
    }

    return ingredient.ingredient_id;
  }

  private async processUnit(unitPayload: any, tx: PrismaClient): Promise<string> {
    const { name } = unitPayload.data;
    const existing = await tx.unit.findUnique({ where: { name } });
    if (existing) return existing.unit_id;

    const unitId = await this.safeId(tx, "unit", "unit_id", unitPayload.unit_id);
    const unit = await tx.unit.create({
      data: { unit_id: unitId, name },
    });
    return unit.unit_id;
  }

  private async processPrepTime(prepTimePayload: any, tx: PrismaClient): Promise<string> {
    const duration = prepTimePayload.data?.duration ||
                     prepTimePayload.duration ||
                     prepTimePayload.prep_time?.data?.duration ||
                     prepTimePayload.prep_time?.duration;
    if (!duration && duration !== 0) {
      throw new Error(`prepTimePayload missing duration. Received: ${JSON.stringify(prepTimePayload)}`);
    }

    const styleId = prepTimePayload.style?.data?.str_value
      ? await this.processCategory(prepTimePayload.style, "Cook", tx)
      : null;

    const prepTimeId = await this.safeId(
      tx,
      "prep_time",
      "prep_time_id",
      prepTimePayload.prep_time_id || prepTimePayload.prep_time?.prep_time_id
    );

    const prepTime = await tx.prep_time.upsert({
      where: { prep_time_id: prepTimeId },
      update: { duration, style_id: styleId },
      create: { prep_time_id: prepTimeId, duration, style_id: styleId },
    });

    return prepTime.prep_time_id;
  }
}
