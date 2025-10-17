import type { PrismaClient } from "@prisma/client";
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
    assert(content && typeof content === "object", "Invalid content payload", "processContent", path, content);

    const content_id = await safeId(this.tx, "content", "content_id", content.content_id);
    const serving_id = await this.atomProcessor.processServings(content.servings);

    const createdContent = await this.tx.content.create({
      data: {
        content_id,
        publication_id: publicationId,
        serving_id,
        total_prep_time: Number.isFinite(content.total_prep_time) ? content.total_prep_time : 0,
        subtitle: typeof content.subtitle === "string" ? content.subtitle : null,
        is_ingredient: !!content.is_ingredient,
      },
    });

    // If the content is just a placeholder for a sub-recipe, do NOT process its children for the parent publication.
    if (content.is_ingredient === true) {
        return createdContent;
    }

    // Process children for normal content
    if (Array.isArray(content.content_segments)) {
      for (const [i, wrap] of content.content_segments.entries()) {
        await this.processContentSegment(wrap, content_id, i, path);
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

  private async processContentSegment(wrap: any, content_id: string, index: number, path: string) {
    if (!wrap?.segment) return;
    const segment_id = await this.atomProcessor.processSegment(wrap.segment, `${path}.content_segments[${index}].segment`);
    await this.tx.content_segment.create({
      data: { content_id, segment_id, position: wrap?.position ?? index + 1 },
    });
    if (Array.isArray(wrap.segment_prep_time)) {
      for (const ptWrap of wrap.segment_prep_time) {
        const pt_id = await this.atomProcessor.processPrepTime(ptWrap, `${path}.content_segments[${index}].segment_prep_time`);
        await this.tx.segment_prep_time.create({ data: { segment_id, prep_time_id: pt_id } });
      }
    }
  }

  private async processContentIngredient(ing: any, content_id: string, index: number, path: string) {
    const ingredient_id = await this.atomProcessor.processIngredient(ing, `${path}.content_ingredients[${index}]`);
    await this.tx.content_ingredient.create({ data: { content_id, ingredient_id } });
  }

  private async processContentPrepTime(pt: any, content_id: string, index: number, path: string) {
    const prep_time_id = await this.atomProcessor.processPrepTime(pt, `${path}.content_prep_times[${index}]`);
    await this.tx.content_prep_time.create({ data: { content_id, prep_time_id } });
  }
}
