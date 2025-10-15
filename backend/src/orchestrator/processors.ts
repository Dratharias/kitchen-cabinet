import { v4 as uuidv4 } from "uuid";
import type { PrismaClient } from "@prisma/client";
import { assert, safeId } from "./utils.js";

/**
 * Handles the creation and lookup of atomic, reusable entities like
 * categories, products, units, etc.
 */
class AtomProcessor {
  constructor(private tx: PrismaClient) {}

  async processCategory(cat: any, fallbackType: string, path: string): Promise<string | null> {
    if (!cat) return null;
    const str_value = (cat.str_value ?? cat.name ?? cat.value ?? "").toString().trim();
    const type = (cat.type ?? fallbackType ?? "").toString().trim();
    if (!str_value || !type) return null;

    const existing = await this.tx.category.findUnique({ where: { str_value_type: { str_value, type } } });
    if (existing) return existing.category_id;

    return (await this.tx.category.create({ data: { category_id: uuidv4(), str_value, type } })).category_id;
  }

  async processProduct(prod: any, path: string): Promise<string> {
    assert(prod?.name, "Product.name is required", "processProduct", `${path}.name`, prod);
    const name = prod.name.toString().trim();
    
    let macro_id: string | null = null;
    if (prod.macro) {
        macro_id = await this.processMacro(prod.macro, `${path}.macro`);
    }

    const existing = await this.tx.product.findUnique({ where: { name } });
    if (existing) return existing.product_id;

    return (await this.tx.product.create({ data: { product_id: uuidv4(), name, macro_id } })).product_id;
  }

  async processMacro(macro: any, path: string): Promise<string> {
    const macro_id = macro.macro_id ?? uuidv4(); 
    const data = { 
        calories: macro.calories, protein: macro.protein, sugar: macro.sugar, 
        fiber: macro.fiber, alcohol: macro.alcohol 
    };
    await this.tx.macro.upsert({
        where: { macro_id },
        create: { macro_id, ...data },
        update: data,
    });
    return macro_id;
  }
  
  async processUnit(unit: any, path: string): Promise<string | null> {
    if (!unit?.name) return null;
    const name = unit.name.toString().trim();
    if (!name) return null;

    const existing = await this.tx.unit.findUnique({ where: { name } });
    if (existing) return existing.unit_id;
    return (await this.tx.unit.create({ data: { unit_id: uuidv4(), name } })).unit_id;
  }

  async processSegment(seg: any, path: string): Promise<string> {
    assert(seg?.paragraph, "Segment.paragraph is required", "processSegment", `${path}.paragraph`, seg);
    const paragraph = seg.paragraph.toString().trim();
    
    const existing = await this.tx.segment.findUnique({ where: { paragraph } });
    if (existing) {
      if (typeof seg.title === "string" && seg.title !== existing.title) {
        await this.tx.segment.update({ where: { segment_id: existing.segment_id }, data: { title: seg.title } });
      }
      return existing.segment_id;
    }
    return (await this.tx.segment.create({ data: { segment_id: seg.segment_id ?? uuidv4(), paragraph, title: seg.title ?? null } })).segment_id;
  }

  async processIngredient(ing: any, path: string): Promise<string> {
    assert(ing, "Ingredient payload missing", "processIngredient", path, ing);
    
    const product_id = await this.processProduct(ing.product, `${path}.product`);
    const ingredient_id = await safeId(this.tx, "ingredient", "ingredient_id", ing.ingredient_id);
    
    const created = await this.tx.ingredient.create({
      data: {
        ingredient_id,
        quantity: typeof ing.quantity === "number" ? ing.quantity : null,
        multiply_factor: Number.isFinite(ing.multiply_factor) ? ing.multiply_factor : 1,
        cut: ing.cut ?? null,
        title: ing.title ?? null,
        product_id,
      },
    });

    if (Array.isArray(ing.ingredient_units)) {
      for (const [i, unitWrap] of ing.ingredient_units.entries()) {
        const unitId = await this.processUnit(unitWrap?.unit, `${path}.ingredient_units[${i}].unit`);
        if (unitId) {
            await this.tx.ingredient_unit.create({
              data: { 
                ingredient_id: created.ingredient_id, 
                unit_id: unitId 
              },
            });
        }
      }
    }

    return created.ingredient_id;
  }

  async processPrepTime(pt: any, path: string): Promise<string> {
    const prepTimePayload = pt.prep_time || pt;
    assert(prepTimePayload, "PrepTime payload missing", "processPrepTime", path, pt);
    const duration = Number(prepTimePayload.duration);
    assert(Number.isFinite(duration), "PrepTime.duration is required", "processPrepTime", `${path}.duration`, prepTimePayload);

    let style_id: string | null = null;
    if (prepTimePayload.style) {
      style_id = await this.processCategory(prepTimePayload.style, "PrepTime", `${path}.style`);
    }
    
    const prep_time_id = prepTimePayload.prep_time_id ?? uuidv4();
    return (await this.tx.prep_time.create({ data: { prep_time_id, duration, style_id } })).prep_time_id;
  }

  async processServings(servings: any): Promise<string | undefined> {
    if (servings && typeof servings === 'object' && servings.yield !== undefined) {
      const { yield: sYield, value: sValue } = servings;
      const serving = await this.tx.servings.upsert({
        where: { serving_id: servings.serving_id ?? uuidv4() },
        create: { yield: sYield, value: sValue, serving_id: uuidv4() },
        update: { yield: sYield, value: sValue },
      });
      return serving.serving_id;
    }
    return undefined;
  }
}

/**
 * Handles the processing of a `content` block within a publication.
 */
class ContentProcessor {
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
        content_id, publication_id: publicationId, serving_id,
        total_prep_time: Number.isFinite(content.total_prep_time) ? content.total_prep_time : 0,
        subtitle: typeof content.subtitle === "string" ? content.subtitle : null,
        is_ingredient: typeof content.is_ingredient === "boolean" ? content.is_ingredient : false,
      },
    });

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

/**
 * Handles the creation and update of a full Publication object.
 */
export class PublicationProcessor {
  private atomProcessor: AtomProcessor;
  private contentProcessor: ContentProcessor;

  constructor(private tx: PrismaClient) {
    this.atomProcessor = new AtomProcessor(this.tx);
    this.contentProcessor = new ContentProcessor(this.tx);
  }

  async create(pub: any) {
    const ctx = "createPublication";
    assert(pub?.title, "Publication.title is required", ctx, "title", pub);

    const publication_id = await safeId(this.tx, "publication", "publication_id", pub.publication_id);
    const type_id = await this.atomProcessor.processCategory(pub.type, "Type", `${ctx}.type`);
    const style_id = await this.atomProcessor.processCategory(pub.style, "Style", `${ctx}.style`);
    const author_id = await this.atomProcessor.processCategory(pub.author, "Author", `${ctx}.author`);

    const created = await this.tx.publication.create({
      data: {
        publication_id, title: pub.title,
        description: Array.isArray(pub.description) ? pub.description : [],
        note: Array.isArray(pub.note) ? pub.note : [],
        public: typeof pub.public === "boolean" ? pub.public : true,
        published: typeof pub.published === "boolean" ? pub.published : true,
        thumbnail: pub.thumbnail ?? null,
        type_id, style_id, author_id,
      },
    });

    await this.processRelations(created.publication_id, pub);
    return created;
  }

  async update(pub: any) {
    const ctx = "updatePublication";
    assert(pub?.publication_id, "Missing publication_id for update", ctx, "publication_id", pub);

    const type_id = await this.atomProcessor.processCategory(pub.type, "Type", `${ctx}.type`);
    const style_id = await this.atomProcessor.processCategory(pub.style, "Style", `${ctx}.style`);
    const author_id = await this.atomProcessor.processCategory(pub.author, "Author", `${ctx}.author`);

    const updated = await this.tx.publication.update({
      where: { publication_id: pub.publication_id },
      data: {
        title: pub.title,
        description: Array.isArray(pub.description) ? pub.description : [],
        note: Array.isArray(pub.note) ? pub.note : [],
        public: typeof pub.public === "boolean" ? pub.public : true,
        published: typeof pub.published === "boolean" ? pub.published : true,
        thumbnail: pub.thumbnail ?? null,
        type_id, style_id, author_id,
      },
    });

    // For updates, we wipe and recreate nested relations for simplicity
    await this.tx.publication_tag.deleteMany({ where: { publication_id: updated.publication_id } });
    await this.tx.content.deleteMany({ where: { publication_id: updated.publication_id } });

    await this.processRelations(updated.publication_id, pub);
    return updated;
  }
  
  private async processRelations(publication_id: string, pub: any) {
    if (Array.isArray(pub.tags)) {
      for (const [i, tag] of pub.tags.entries()) {
        const tagId = await this.atomProcessor.processCategory(tag, "Tag", `tags[${i}]`);
        if (tagId) {
          await this.tx.publication_tag.create({ data: { publication_id, category_id: tagId } });
        }
      }
    }
    if (Array.isArray(pub.contents)) {
      for (const [i, content] of pub.contents.entries()) {
        await this.contentProcessor.process(content, publication_id, `contents[${i}]`);
      }
    }
  }
}

