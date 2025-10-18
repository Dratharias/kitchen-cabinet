import { v4 as uuidv4 } from "uuid";
import type { PrismaClient } from "@prisma/client";
import { Prisma } from "@prisma/client";
import { assert, safeId } from "./utils.js";
import { AtomProcessor } from "./atom.processor.js";

/**
 * Handles the processing of a `content` block within a publication.
 */
export class ContentProcessor {
  private atomProcessor: AtomProcessor;
  constructor(private tx: PrismaClient) {
    this.atomProcessor = new AtomProcessor(this.tx);
  }

  async process(content: any, publicationId: string, path: string) {
    assert(
      content && typeof content === "object",
      "Invalid content payload",
      "processContent",
      path,
      content,
    );

    const content_id = await safeId(
      this.tx,
      "content",
      "content_id",
      content.content_id,
    );
    const serving_id = await this.atomProcessor.processServings(
      content.servings,
    );

    const createdContent = await this.tx.content.create({
      data: {
        content_id,
        publication_id: publicationId,
        serving_id,
        total_prep_time: Number.isFinite(content.total_prep_time)
          ? content.total_prep_time
          : 0,
        subtitle:
          typeof content.subtitle === "string" ? content.subtitle : null,
        is_ingredient: !!content.is_ingredient,
      },
    });

    // If the content is just a placeholder for a sub-recipe, do NOT process its children for the parent publication.
    if (content.is_ingredient === true) {
      return createdContent;
    }

    // Process children for normal content
    if (Array.isArray(content.content_segments)) {
      for (const [i, segmentData] of content.content_segments.entries()) {
        await this.processContentSegment(segmentData, content_id, i, path);
      }
    }
    if (Array.isArray(content.content_ingredients)) {
      for (const [i, ing] of content.content_ingredients.entries()) {
        await this.processContentIngredient(ing, content_id, i, path);
      }
    }
    if (Array.isArray(content.content_prep_times)) {
      for (const [i, pt] of content.content_prep_times.entries()) {
        await this.processContentPrepTime(pt, content_id, i, path);
      }
    }

    return createdContent;
  }

  private async processContentSegment(
    segmentData: any,
    content_id: string,
    index: number,
    path: string,
  ) {
    // Accommodate both nested (create) and flat (update) structures.
    const segmentPayload = segmentData.segment || segmentData;

    if (!segmentPayload?.paragraph) return;

    const segment_id = await this.atomProcessor.processSegment(
      segmentPayload,
      `${path}.content_segments[${index}]`,
    );

    await this.tx.content_segment.create({
      data: {
        content_id,
        segment_id,
        position: segmentData?.position ?? index + 1,
      },
    });

    // Handle nested prep times if they exist on the segment.
    if (Array.isArray(segmentPayload.segment_prep_time)) {
      for (const ptWrap of segmentPayload.segment_prep_time) {
        const prepTimeData = ptWrap.prep_time || ptWrap; // The payload might wrap the data in a 'prep_time' key.
        const pt_id = await this.atomProcessor.processPrepTime(
          prepTimeData,
          `${path}.content_segments[${index}].segment_prep_time`,
        );
        await this.tx.segment_prep_time.create({
          data: { segment_id, prep_time_id: pt_id },
        });
      }
    }
  }

  private async processContentIngredient(
    ing: any,
    content_id: string,
    index: number,
    path: string,
  ) {
    assert(
      ing,
      "Ingredient payload missing",
      "processContentIngredient",
      path,
      ing,
    );

    // 1. Ensure the base product exists (e.g., "Flour")
    const product_id = await this.atomProcessor.processProduct(
      ing.product,
      `${path}.content_ingredients[${index}].product`,
    );

    // 2. Upsert the specific ingredient instance (e.g., "500g of Flour, sifted")
    const ingredient_id = ing.ingredient_id ?? uuidv4();

    // Robustly handle quantity and multiply_factor which might be numbers or numeric strings
    const rawQuantity = ing.quantity;
    const quantityValue =
      rawQuantity === null || rawQuantity === undefined || rawQuantity === ""
        ? null
        : Number(rawQuantity);

    const rawFactor = ing.multiply_factor;
    let factorValue =
      rawFactor === null || rawFactor === undefined || rawFactor === ""
        ? 1
        : Number(rawFactor);
    if (!Number.isFinite(factorValue)) {
      factorValue = 1;
    }

    const ingredientData = {
      quantity: Number.isFinite(quantityValue)
        ? new Prisma.Decimal(quantityValue as number)
        : null,
      multiply_factor: new Prisma.Decimal(factorValue),
      cut: ing.cut ?? null,
      title: ing.title ?? null,
      product_id,
    };

    const upsertedIngredient = await this.tx.ingredient.upsert({
      where: { ingredient_id },
      update: ingredientData,
      create: {
        ingredient_id,
        ...ingredientData,
      },
    });

    // 3. Handle units for this ingredient instance
    await this.tx.ingredient_unit.deleteMany({
      where: { ingredient_id: upsertedIngredient.ingredient_id },
    });

    if (Array.isArray(ing.ingredient_units)) {
      for (const unitWrap of ing.ingredient_units) {
        const unitName = unitWrap?.name || unitWrap?.unit?.name;
        if (unitName) {
          const unit = await this.tx.unit.upsert({
            where: { name: unitName },
            create: { name: unitName },
            update: {},
          });
          await this.tx.ingredient_unit.create({
            data: {
              ingredient_id: upsertedIngredient.ingredient_id,
              unit_id: unit.unit_id,
            },
          });
        }
      }
    }

    // 4. Link the ingredient instance to the content
    await this.tx.content_ingredient.create({
      data: { content_id, ingredient_id: upsertedIngredient.ingredient_id },
    });
  }

  private async processContentPrepTime(
    pt: any,
    content_id: string,
    index: number,
    path: string,
  ) {
    const prep_time_id = await this.atomProcessor.processPrepTime(
      pt,
      `${path}.content_prep_times[${index}]`,
    );
    await this.tx.content_prep_time.create({
      data: { content_id, prep_time_id },
    });
  }
}
