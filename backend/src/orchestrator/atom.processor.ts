import { v4 as uuidv4 } from "uuid";
import { type PrismaClient } from "@prisma/client";
import { assert } from "./utils.js";

export class AtomProcessor {
  constructor(private tx: PrismaClient) {}

  async processCategory(
    cat: any,
    fallbackType: string,
    path: string,
  ): Promise<string | null> {
    if (!cat) return null;
    const str_value = (cat.str_value ?? cat.name ?? cat.value ?? "")
      .toString()
      .trim();
    const type = (cat.type ?? fallbackType ?? "").toString().trim();
    if (!str_value || !type) return null;

    const existing = await this.tx.category.findUnique({
      where: { str_value_type: { str_value, type } },
    });
    if (existing) return existing.category_id;

    return (
      await this.tx.category.create({
        data: { category_id: uuidv4(), str_value, type },
      })
    ).category_id;
  }

  async processProduct(prod: any, path: string): Promise<string> {
    assert(
      prod?.name,
      "Product.name is required",
      "processProduct",
      `${path}.name`,
      prod,
    );
    const name = prod.name.toString().trim();

    let macro_id: string | null = null;
    if (prod.macro) {
      macro_id = await this.processMacro(prod.macro, `${path}.macro`);
    }

    const is_recipe_id = prod.is_recipe_id ?? null;

    // This data will be used for both creation and update.
    const productData = {
      name,
      macro_id,
      is_recipe_id,
    };

    const product = await this.tx.product.upsert({
      where: { name },
      create: {
        product_id: uuidv4(),
        ...productData,
      },
      update: productData, // Ensure existing products are also updated with new macro or recipe links
    });

    return product.product_id;
  }

  async processMacro(macro: any, path: string): Promise<string> {
    const macro_id = macro.macro_id ?? uuidv4();
    const data = {
      calories: macro.calories,
      protein: macro.protein,
      sugar: macro.sugar,
      fiber: macro.fiber,
      alcohol: macro.alcohol,
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
    return (await this.tx.unit.create({ data: { unit_id: uuidv4(), name } }))
      .unit_id;
  }

  async processSegment(seg: any, path: string): Promise<string> {
    assert(
      seg?.paragraph,
      "Segment.paragraph is required",
      "processSegment",
      `${path}.paragraph`,
      seg,
    );
    const paragraph = seg.paragraph.toString().trim();

    const existing = await this.tx.segment.findFirst({ where: { paragraph } });
    if (existing) {
      if (typeof seg.title === "string" && seg.title !== existing.title) {
        await this.tx.segment.update({
          where: { segment_id: existing.segment_id },
          data: { title: seg.title },
        });
      }
      return existing.segment_id;
    }
    return (
      await this.tx.segment.create({
        data: {
          segment_id: seg.segment_id ?? uuidv4(),
          paragraph,
          title: seg.title ?? null,
        },
      })
    ).segment_id;
  }

  async processPrepTime(pt: any, path: string): Promise<string> {
    const prepTimePayload = pt.prep_time || pt;
    assert(
      prepTimePayload,
      "PrepTime payload missing",
      "processPrepTime",
      path,
      pt,
    );
    const duration = Number(prepTimePayload.duration);
    assert(
      Number.isFinite(duration),
      "PrepTime.duration is required",
      "processPrepTime",
      `${path}.duration`,
      prepTimePayload,
    );

    let style_id: string | null = null;
    if (prepTimePayload.style) {
      style_id = await this.processCategory(
        prepTimePayload.style,
        "PrepTime",
        `${path}.style`,
      );
    }

    const prep_time_id = prepTimePayload.prep_time_id ?? uuidv4();
    const data = { duration, style_id };

    const prepTime = await this.tx.prep_time.upsert({
      where: { prep_time_id },
      create: { prep_time_id, ...data },
      update: data,
    });

    return prepTime.prep_time_id;
  }

  async processServings(servings: any): Promise<string | undefined> {
    if (
      servings &&
      typeof servings === "object" &&
      servings.yield !== undefined
    ) {
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
