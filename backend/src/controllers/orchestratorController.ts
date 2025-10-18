import { prisma } from "../config.js";
import { PublicationProcessor } from "../orchestrator/processors.js";
import { logError, assert, OrchestratorError } from "../orchestrator/utils.js";
import type {
  OrchestratorRequest,
  OrchestratorResponse,
} from "../types/orchestrator.types.js";
import { Prisma } from "@prisma/client";
import { v4 as uuidv4 } from "uuid";

async function createAndConnectIngredient(
  tx: Prisma.TransactionClient,
  payload: any,
) {
  assert(
    payload.product,
    "Product data is required",
    "createAndConnectIngredient",
  );
  const productName =
    typeof payload.product === "string"
      ? payload.product
      : payload.product.name;
  assert(productName, "Product name is required", "createAndConnectIngredient");

  // 1. Gérer la création de la macro en premier
  let macro_id: string | null = null;
  if (payload.macro && typeof payload.macro === "object") {
    const newMacro = await tx.macro.create({
      data: {
        ...payload.macro,
        macro_id: uuidv4(),
      },
    });
    macro_id = newMacro.macro_id;
  }

  // 2. Upsert le produit en liant la nouvelle macro
  const product = await tx.product.upsert({
    where: { name: productName },
    create: {
      name: productName,
      macro_id: macro_id, // Lier à la création
    },
    update: {
      macro_id: macro_id, // Lier aussi à la mise à jour (si le produit existe déjà)
    },
  });

  // 3. Créer l'ingrédient
  const ingredient_id = uuidv4();
  await tx.ingredient.create({
    data: {
      ingredient_id,
      quantity: Number(payload.quantity) || 0,
      multiply_factor: Number(payload.multiply_factor) || 1,
      product_id: product.product_id,
      cut: payload.cut ?? null,
      title: payload.title ?? null,
    },
  });

  // 4. Gérer l'unité
  const unitName = payload.unit || payload.ingredient_units?.[0]?.name;
  if (unitName) {
    const unit = await tx.unit.upsert({
      where: { name: unitName },
      create: { name: unitName },
      update: {},
    });
    await tx.ingredient_unit.create({
      data: { ingredient_id, unit_id: unit.unit_id },
    });
  }

  return ingredient_id;
}

async function createAndConnectSegment(
  tx: Prisma.TransactionClient,
  payload: any,
) {
  assert(
    payload.paragraph,
    "Segment paragraph is required",
    "createAndConnectSegment",
  );
  const newSegment = await tx.segment.create({
    data: {
      segment_id: uuidv4(),
      paragraph: payload.paragraph,
      title: payload.title ?? null,
    },
  });

  if (Array.isArray(payload.segment_prep_time)) {
    for (const ptData of payload.segment_prep_time) {
      const { duration, style } = ptData;
      let style_id = null;
      if (style?.str_value) {
        const upsertedStyle = await tx.category.upsert({
          where: {
            str_value_type: {
              str_value: style.str_value,
              type: style.type || "PrepStyle",
            },
          },
          create: {
            str_value: style.str_value,
            type: style.type || "PrepStyle",
          },
          update: {},
        });
        style_id = upsertedStyle.category_id;
      }

      if (duration > 0) {
        const newPrepTime = await tx.prep_time.create({
          data: { duration: Number(duration), style_id },
        });
        await tx.segment_prep_time.create({
          data: {
            segment_id: newSegment.segment_id,
            prep_time_id: newPrepTime.prep_time_id,
          },
        });
      }
    }
  }
  return newSegment.segment_id;
}

async function handleAtomicPublicationUpdate(
  tx: Prisma.TransactionClient,
  id: string,
  payload: any,
) {
  if (payload.description && typeof payload.description === "string") {
    payload.description = payload.description.split("\n");
  }
  return tx.publication.update({
    where: { publication_id: id },
    data: payload,
  });
}

async function handleAtomicContentUpdate(
  tx: Prisma.TransactionClient,
  id: string,
  payload: any,
) {
  const data: Prisma.contentUpdateInput = {};
  if (payload.subtitle !== undefined) data.subtitle = payload.subtitle;

  if (payload.servings && typeof payload.servings === "object") {
    const currentContent = await tx.content.findUnique({
      where: { content_id: id },
      select: { serving_id: true },
    });
    if (currentContent?.serving_id) {
      await tx.servings.update({
        where: { serving_id: currentContent.serving_id },
        data: payload.servings,
      });
    } else {
      const newServing = await tx.servings.create({
        data: { ...payload.servings, serving_id: uuidv4() },
      });
      data.servings = { connect: { serving_id: newServing.serving_id } };
    }
  }

  if (Object.keys(data).length > 0) {
    await tx.content.update({ where: { content_id: id }, data });
  }

  if (payload.content_ingredients?.connect) {
    for (const ingData of payload.content_ingredients.connect) {
      const newIngredientId = await createAndConnectIngredient(tx, ingData);
      await tx.content_ingredient.create({
        data: { content_id: id, ingredient_id: newIngredientId },
      });
    }
  }

  if (payload.content_segments?.connect) {
    const lastPosition =
      (
        await tx.content_segment.findFirst({
          where: { content_id: id },
          orderBy: { position: "desc" },
        })
      )?.position ?? 0;
    let currentPosition = lastPosition;
    for (const segData of payload.content_segments.connect) {
      currentPosition++;
      const newSegmentId = await createAndConnectSegment(tx, segData.segment);
      await tx.content_segment.create({
        data: {
          content_id: id,
          segment_id: newSegmentId,
          position: currentPosition,
        },
      });
    }
  }

  return tx.content.findUnique({
    where: { content_id: id },
    include: {
      servings: true,
      content_segments: {
        include: { segment: true },
        orderBy: { position: "asc" },
      },
      content_ingredients: { include: { ingredient: true } },
    },
  });
}

async function handleAtomicIngredientUpdate(
  tx: Prisma.TransactionClient,
  id: string,
  payload: any,
) {
  const data: Prisma.ingredientUpdateInput = {};
  if (payload.quantity !== undefined) data.quantity = Number(payload.quantity);
  if (payload.cut !== undefined) data.cut = payload.cut;
  if (payload.title !== undefined) data.title = payload.title;
  if (payload.multiply_factor !== undefined)
    data.multiply_factor = Number(payload.multiply_factor);

  if (payload.product && typeof payload.product === "string") {
    const product = await tx.product.upsert({
      where: { name: payload.product },
      create: { name: payload.product },
      update: {},
    });
    data.product = { connect: { product_id: product.product_id } };
  }

  if (payload.unit && typeof payload.unit === "string") {
    const unit = await tx.unit.upsert({
      where: { name: payload.unit },
      create: { name: payload.unit },
      update: {},
    });
    data.ingredient_units = {
      deleteMany: {},
      create: { unit: { connect: { unit_id: unit.unit_id } } },
    };
  }

  if (payload.macro && typeof payload.macro === "object") {
    const currentIngredient = await tx.ingredient.findUnique({
      where: { ingredient_id: id },
      select: { product: { select: { macro_id: true } } },
    });
    if (currentIngredient?.product?.macro_id) {
      await tx.macro.update({
        where: { macro_id: currentIngredient.product.macro_id },
        data: payload.macro,
      });
    }
  }

  return tx.ingredient.update({
    where: { ingredient_id: id },
    data,
    include: { product: true, ingredient_units: { include: { unit: true } } },
  });
}

async function handleAtomicSegmentUpdate(
  tx: Prisma.TransactionClient,
  id: string,
  payload: any,
) {
  const { segment_prep_time, ...scalarData } = payload;
  const data: Prisma.segmentUpdateInput = scalarData;

  if (Array.isArray(segment_prep_time)) {
    await tx.segment_prep_time.deleteMany({ where: { segment_id: id } });
    if (segment_prep_time.length > 0) {
      const prepTimeCreations = segment_prep_time.map(async (ptData: any) => {
        const { duration, style } = ptData;
        let style_id = null;
        if (style?.str_value) {
          const upsertedStyle = await tx.category.upsert({
            where: {
              str_value_type: {
                str_value: style.str_value,
                type: style.type || "PrepStyle",
              },
            },
            create: {
              str_value: style.str_value,
              type: style.type || "PrepStyle",
            },
            update: {},
          });
          style_id = upsertedStyle.category_id;
        }
        const newPrepTime = await tx.prep_time.create({
          data: { duration: Number(duration), style_id },
        });
        return newPrepTime.prep_time_id;
      });
      const newPrepTimeIds = await Promise.all(prepTimeCreations);
      await tx.segment_prep_time.createMany({
        data: newPrepTimeIds.map((prep_time_id) => ({
          segment_id: id,
          prep_time_id,
        })),
      });
    }
  }

  return tx.segment.update({ where: { segment_id: id }, data });
}

async function handleAtomicProductUpdate(
  tx: Prisma.TransactionClient,
  id: string,
  payload: any,
) {
  return tx.product.update({ where: { product_id: id }, data: payload });
}
async function handleAtomicMacroUpdate(
  tx: Prisma.TransactionClient,
  id: string,
  payload: any,
) {
  return tx.macro.update({ where: { macro_id: id }, data: payload });
}
async function handleAtomicUnitUpdate(
  tx: Prisma.TransactionClient,
  id: string,
  payload: any,
) {
  return tx.unit.update({ where: { unit_id: id }, data: payload });
}
async function handleAtomicCategoryUpdate(
  tx: Prisma.TransactionClient,
  id: string,
  payload: any,
) {
  return tx.category.update({ where: { category_id: id }, data: payload });
}
async function handleAtomicPrepTimeUpdate(
  tx: Prisma.TransactionClient,
  id: string,
  payload: any,
) {
  return tx.prep_time.update({ where: { prep_time_id: id }, data: payload });
}
async function handleAtomicReviewUpdate(
  tx: Prisma.TransactionClient,
  id: string,
  payload: any,
) {
  return tx.review.update({ where: { review_id: id }, data: payload });
}
async function handleAtomicServingsUpdate(
  tx: Prisma.TransactionClient,
  id: string,
  payload: any,
) {
  return tx.servings.update({ where: { serving_id: id }, data: payload });
}
// #endregion

export class OrchestratorController {
  public async processRequest(
    req: OrchestratorRequest,
  ): Promise<OrchestratorResponse> {
    const { action, payload } = req;
    if (!["create", "update", "delete"].includes(action)) {
      return { success: false, error: `Action '${action}' not supported.` };
    }
    try {
      const results = await prisma.$transaction(
        async (tx: any) => {
          const out: Record<string, unknown> = {};
          const processor = new PublicationProcessor(tx);

          if (action === "create") {
            for (const key in payload) {
              const data = (payload as any)[key];
              assert(
                data,
                "Missing payload for create",
                "processRequest:create",
                `payload.${key}`,
              );
              if (data.title && Array.isArray(data.contents)) {
                out[key] = await processor.create({
                  publication_id: key,
                  ...data,
                });
              } else {
                throw new OrchestratorError(
                  `'${key}' is not a valid structure for a 'create' action.`,
                  "processRequest:create",
                );
              }
            }
          } else {
            for (const resourceType of Object.keys(payload || {})) {
              const entities = (payload as any)[resourceType];
              assert(
                entities && typeof entities === "object",
                `Invalid payload for '${resourceType}'`,
                `processRequest:${action}`,
              );
              for (const id in entities) {
                const data = entities[id];
                if (action === "update") {
                  if (resourceType === "publications") {
                    // Route full publication updates to the dedicated processor
                    out[id] = await processor.update({
                      publication_id: id,
                      ...data,
                    });
                  } else {
                    // Keep the original logic for other atomic updates
                    const handlerMap: Record<string, Function> = {
                      contents: handleAtomicContentUpdate,
                      ingredients: handleAtomicIngredientUpdate,
                      segments: handleAtomicSegmentUpdate,
                      products: handleAtomicProductUpdate,
                      macros: handleAtomicMacroUpdate,
                      units: handleAtomicUnitUpdate,
                      categories: handleAtomicCategoryUpdate,
                      prepTimes: handleAtomicPrepTimeUpdate,
                      reviews: handleAtomicReviewUpdate,
                      servings: handleAtomicServingsUpdate,
                    };
                    if (!handlerMap[resourceType])
                      throw new OrchestratorError(
                        `Update not supported for '${resourceType}'`,
                        "processRequest:update",
                      );
                    out[id] = await handlerMap[resourceType](tx, id, data);
                  }
                } else {
                  // delete
                  if (data !== null) continue;
                  // Simplified delete logic
                  const modelName = resourceType.slice(0, -1);
                  const idFieldName = `${modelName}_id`;
                  await (tx[modelName] as any).delete({
                    where: { [idFieldName]: id },
                  });
                  out[id] = { id, deleted: true };
                }
              }
            }
          }
          return out;
        },
        { maxWait: 20000, timeout: 40000 },
      );
      return { success: true, results: results as any };
    } catch (error: any) {
      logError("transaction", error, { payload });
      return {
        success: false,
        error:
          error instanceof OrchestratorError
            ? `[${error.context}] ${error.message}`
            : "Internal server error",
      };
    }
  }
}
