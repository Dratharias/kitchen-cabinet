import { v4 as uuidv4 } from "uuid";
import { prisma } from "../config.js";
import {
  OrchestratorRequest,
  OrchestratorResponse,
} from "../types/orchestrator.types.js";
import { PrismaClient } from "@prisma/client";

export class OrchestratorController {
  public async processRequest(
    request: OrchestratorRequest
  ): Promise<OrchestratorResponse> {
    const { action, payload } = request;

    if (action === "create") {
      try {
        const results = await prisma.$transaction(async (tx) => {
          const resultsMap: any = {};

          for (const key in payload) {
            const publicationData = payload[key];
            const processedResult = await this.processPublication(
              publicationData,
              tx as any
            );
            resultsMap[key] = processedResult;
          }
          return resultsMap;
        });

        return { success: true, results };
      } catch (error: any) {
        console.error("Orchestrator transaction failed:", error);
        return { success: false, error: error.message };
      }
    } else {
      return {
        success: false,
        error: `Action '${action}' not supported yet.`,
      };
    }
  }

  private async processPublication(
    publicationData: any,
    tx: PrismaClient
  ): Promise<any> {
    // Process Categories (Type, Style, Author)
    const typeId = publicationData.type?.data?.str_value
      ? await this.processCategory(publicationData.type, "Type", tx)
      : null;
    const styleId = publicationData.style?.data?.str_value
      ? await this.processCategory(publicationData.style, "Style", tx)
      : null;
    const authorId = publicationData.author?.data?.str_value
      ? await this.processCategory(publicationData.author, "Author", tx)
      : null;

    // Create or update Publication
    const publicationId = publicationData.publication_id || uuidv4();
    const publication = await tx.publication.upsert({
      where: { publication_id: publicationId },
      update: {
        title: publicationData.title,
        description: publicationData.description,
        note: publicationData.note,
        thumbnail: publicationData.thumbnail,
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
        type_id: typeId,
        style_id: styleId,
        author_id: authorId,
        public: true,
        published: true,
      },
    });

    // Process Tags
    if (publicationData.tags) {
      for (const tagPayload of publicationData.tags) {
        const categoryId = await this.processCategory(
          tagPayload,
          "Tag",
          tx
        );
        await tx.publication_tag.create({
          data: {
            publication_id: publication.publication_id,
            category_id: categoryId,
          },
        });
      }
    }

    // Process Contents
    if (publicationData.contents) {
      for (const contentPayload of publicationData.contents) {
        await this.processContent(contentPayload, publication.publication_id, tx);
      }
    }

    return publication;
  }

  private async processContent(
    contentPayload: any,
    publicationId: string,
    tx: PrismaClient
  ): Promise<void> {
    const contentId = contentPayload.content_id || uuidv4();
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

    // Process Segments
    if (contentPayload.content_segments) {
      for (const segmentPayload of contentPayload.content_segments) {
        const segmentId = await this.processSegment(
          segmentPayload.segment,
          tx
        );
        await tx.content_segment.create({
          data: {
            content_id: content.content_id,
            segment_id: segmentId,
            position: segmentPayload.position,
          },
        });
      }
    }

    // Process Ingredients
    if (contentPayload.content_ingredients) {
      for (const ingredientPayload of contentPayload.content_ingredients) {
        const ingredientId = await this.processIngredient(
          ingredientPayload,
          tx
        );
        await tx.content_ingredient.create({
          data: {
            content_id: content.content_id,
            ingredient_id: ingredientId,
          },
        });
      }
    }

    // Process PrepTimes
    if (contentPayload.content_prep_times) {
      for (const prepTimePayload of contentPayload.content_prep_times) {
        await this.processPrepTime(
          prepTimePayload,
          tx
        );
      }
    }
  }

  private async processCategory(
    categoryPayload: any,
    type: string,
    tx: PrismaClient
  ): Promise<string> {
    const { str_value } = categoryPayload.data;
    const existingCategory = await tx.category.findUnique({
      where: { str_value_type: { str_value, type } },
    });

    if (existingCategory) {
      return existingCategory.category_id;
    }

    const newCategoryId = uuidv4();
    const newCategory = await tx.category.create({
      data: {
        category_id: newCategoryId,
        str_value,
        type,
      },
    });
    return newCategory.category_id;
  }

  private async processSegment(
    segmentPayload: any,
    tx: PrismaClient
  ): Promise<string> {
    const { paragraph } = segmentPayload.data;
    const existingSegment = await tx.segment.findUnique({
      where: { paragraph },
    });

    if (existingSegment) {
      return existingSegment.segment_id;
    }

    const newSegmentId = uuidv4();
    const newSegment = await tx.segment.create({
      data: {
        segment_id: newSegmentId,
        paragraph,
        title: segmentPayload.data.title,
        order_num: segmentPayload.data.order_num,
      },
    });
    return newSegment.segment_id;
  }

  private async processProduct(
    productPayload: any,
    tx: PrismaClient
  ): Promise<string> {
    const { name } = productPayload.data;
    const existingProduct = await tx.product.findUnique({
      where: { name },
    });

    if (existingProduct) {
      return existingProduct.product_id;
    }

    const newProductId = uuidv4();
    const newProduct = await tx.product.create({
      data: {
        product_id: newProductId,
        name,
        en_name: productPayload.data.en_name,
        macro: productPayload.data.macro
          ? {
              create: {
                macro_id: uuidv4(),
                calories: productPayload.data.macro.calories,
                protein: productPayload.data.macro.protein,
              },
            }
          : undefined,
      },
    });
    return newProduct.product_id;
  }

  private async processIngredient(
    ingredientPayload: any,
    tx: PrismaClient
  ): Promise<string> {
    // Process nested product
    const productId = await this.processProduct(
      ingredientPayload.product,
      tx
    );

    const ingredientId = ingredientPayload.ingredient_id || uuidv4();
    const ingredient = await tx.ingredient.upsert({
      where: { ingredient_id: ingredientId },
      update: {
        quantity: ingredientPayload.data.quantity,
        multiply_factor: ingredientPayload.data.multiply_factor,
        product_id: productId,
      },
      create: {
        ingredient_id: ingredientId,
        quantity: ingredientPayload.data.quantity,
        multiply_factor: ingredientPayload.data.multiply_factor,
        product_id: productId,
      },
    });

    // Process nested units
    if (ingredientPayload.ingredient_units) {
      for (const unitPayload of ingredientPayload.ingredient_units) {
        const unitId = await this.processUnit(
          unitPayload,
          tx
        );
        await tx.ingredient_unit.create({
          data: {
            ingredient_id: ingredient.ingredient_id,
            unit_id: unitId,
          },
        });
      }
    }

    return ingredient.ingredient_id;
  }

  private async processUnit(
    unitPayload: any,
    tx: PrismaClient
  ): Promise<string> {
    const { name } = unitPayload.data;
    const existingUnit = await tx.unit.findUnique({
      where: { name },
    });

    if (existingUnit) {
      return existingUnit.unit_id;
    }

    const newUnitId = uuidv4();
    const newUnit = await tx.unit.create({
      data: {
        unit_id: newUnitId,
        name,
      },
    });
    return newUnit.unit_id;
  }

  private async processPrepTime(
    prepTimePayload: any,
    tx: PrismaClient
  ): Promise<string> {
    const styleId = prepTimePayload.style?.data?.str_value
      ? await this.processCategory(prepTimePayload.style, "Cook", tx)
      : null;
      
    const prepTimeId = prepTimePayload.prep_time_id || uuidv4();
    const prepTime = await tx.prep_time.upsert({
      where: { prep_time_id: prepTimeId },
      update: {
        duration: prepTimePayload.data.duration,
        style_id: styleId,
      },
      create: {
        prep_time_id: prepTimeId,
        duration: prepTimePayload.data.duration,
        style_id: styleId,
      },
    });

    return prepTime.prep_time_id;
  }
}