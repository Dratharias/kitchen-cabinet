import { prisma } from "../config.js";
import { PublicationProcessor } from "../orchestrator/processors.js";
import { logError, assert, OrchestratorError } from "../orchestrator/utils.js";
import type { OrchestratorRequest, OrchestratorResponse } from "../types/orchestrator.types.js";
import { Prisma } from "@prisma/client";
import { v4 as uuidv4 } from "uuid";

/**
 * Handles the creation of a new Ingredient and links it to a Content entity.
 */
async function handleAtomicIngredientCreate(tx: Prisma.TransactionClient, contentId: string, payload: any) {
    assert(payload.product?.name, "Product name is required for new ingredient", "handleAtomicIngredientCreate");

    const product = await tx.product.upsert({
        where: { name: payload.product.name },
        create: { name: payload.product.name },
        update: {},
    });

    const ingredient_id = uuidv4();
    await tx.ingredient.create({
        data: {
            ingredient_id,
            quantity: Number(payload.quantity) || 0,
            multiply_factor: Number(payload.multiply_factor) || 1,
            product_id: product.product_id,
            cut: payload.cut ?? null,
            title: payload.title ?? null,
        }
    });

    if (payload.ingredient_units?.[0]?.unit?.name) {
        const unitName = payload.ingredient_units[0].unit.name;
        const unit = await tx.unit.upsert({
            where: { name: unitName },
            create: { name: unitName },
            update: {},
        });
        await tx.ingredient_unit.create({
            data: {
                ingredient_id,
                unit_id: unit.unit_id,
            }
        });
    }

    await tx.content_ingredient.create({
        data: {
            content_id: contentId,
            ingredient_id,
        }
    });

    return tx.ingredient.findUnique({
        where: { ingredient_id },
        include: {
            product: true,
            ingredient_units: { include: { unit: true } }
        }
    });
}

/**
 * Handles the creation of a new Segment and links it to a Content entity.
 */
async function handleAtomicSegmentCreate(tx: Prisma.TransactionClient, contentId: string, payload: any) {
    assert(payload.paragraph, "Segment paragraph is required", "handleAtomicSegmentCreate");

    const segment_id = uuidv4();
    const newSegment = await tx.segment.create({
        data: {
            segment_id,
            paragraph: payload.paragraph,
            title: payload.title ?? null,
        }
    });
    
    const lastSegment = await tx.content_segment.findFirst({
        where: { content_id: contentId },
        orderBy: { position: 'desc' }
    });
    const newPosition = (lastSegment?.position ?? 0) + 1;

    await tx.content_segment.create({
        data: {
            content_id: contentId,
            segment_id,
            position: newPosition,
        }
    });

    return newSegment;
}

/**
 * Handles atomic updates for an Ingredient entity. It translates simple
 * frontend payloads into complex Prisma relation updates.
 */
async function handleAtomicIngredientUpdate(tx: Prisma.TransactionClient, id: string, payload: any) {
    const data: Prisma.ingredientUpdateInput = {};
    
    if (payload.quantity !== undefined) data.quantity = Number(payload.quantity);
    if (payload.cut !== undefined) data.cut = payload.cut;
    if (payload.title !== undefined) data.title = payload.title;

    // Handle product update, which can be an object like { name: 'New Product' }
    if (payload.product && typeof payload.product === 'object' && typeof payload.product.name === 'string') {
        const productName = payload.product.name;
        const product = await tx.product.upsert({
            where: { name: productName },
            create: { name: productName },
            update: {},
        });
        data.product = { connect: { product_id: product.product_id } };
    }
    
    // Handle unit update, which comes in as { ingredient_units: [{ unit: { name: 'New Unit' } }] }
    if (payload.ingredient_units && Array.isArray(payload.ingredient_units) && payload.ingredient_units[0]?.unit?.name) {
        const unitName = payload.ingredient_units[0].unit.name;
        const unit = await tx.unit.upsert({
            where: { name: unitName },
            create: { name: unitName },
            update: {},
        });
        // This replaces all existing units for the ingredient with the new one.
        data.ingredient_units = {
            deleteMany: {},
            create: {
                unit: { connect: { unit_id: unit.unit_id } },
            },
        };
    }

    return tx.ingredient.update({ 
        where: { ingredient_id: id }, 
        data,
        include: {
            product: true,
            ingredient_units: {
                include: {
                    unit: true
                }
            }
        }
    });
}

/**
 * Handles atomic updates for a Content entity, including upserting Servings.
 */
async function handleAtomicContentUpdate(tx: Prisma.TransactionClient, id: string, payload: any) {
    const data: Prisma.contentUpdateInput = {};

    if (payload.subtitle !== undefined) data.subtitle = payload.subtitle;

    if (payload.servings && typeof payload.servings === 'object') {
        const currentContent = await tx.content.findUnique({ where: { content_id: id }, select: { serving_id: true } });
        
        if (currentContent?.serving_id) {
            const updatedServing = await tx.servings.update({
                where: { serving_id: currentContent.serving_id },
                data: payload.servings
            });
            data.servings = { connect: { serving_id: updatedServing.serving_id } };
        } else {
            const newServing = await tx.servings.create({
                data: { ...payload.servings, serving_id: uuidv4() }
            });
            data.servings = { connect: { serving_id: newServing.serving_id } };
        }
    }
    
    return tx.content.update({ where: { content_id: id }, data, include: { servings: true } });
}

/**
 * Handles atomic updates for a Segment entity.
 */
async function handleAtomicSegmentUpdate(tx: Prisma.TransactionClient, id: string, payload: any) {
    return tx.segment.update({ where: { segment_id: id }, data: payload });
}

/**
 * Handles atomic updates for a Publication entity.
 */
async function handleAtomicPublicationUpdate(tx: Prisma.TransactionClient, id: string, payload: any) {
    // Ensure description is an array if it's a string
    if (payload.description && typeof payload.description === 'string') {
        payload.description = payload.description.split('\n');
    }
    return tx.publication.update({ where: { publication_id: id }, data: payload });
}
// #endregion


export class OrchestratorController {
  public async processRequest(req: OrchestratorRequest): Promise<OrchestratorResponse> {
    const { action, payload } = req;

    if (!["create", "update", "delete"].includes(action)) {
      return { success: false, error: `Action '${action}' not supported.` };
    }

    try {
      const results = await prisma.$transaction(async (tx: any) => {
        const out: Record<string, unknown> = {};
        const processor = new PublicationProcessor(tx);

        for (const key of Object.keys(payload || {})) {
          const data = (payload as any)[key];
          assert(key, "Missing payload key", "processRequest");

          if (action === "create") {
            assert(data, "Missing payload for create", "processRequest", `payload.${key}`);
            
            // Heuristic to differentiate between full publication and atomic creation
            if (data.title && Array.isArray(data.contents)) {
                // Full publication creation
                out[key] = await processor.create(data);
            } else {
                // Atomic creation: key is the parent ID
                const parentId = key;
                let newEntity = null;

                // Check if it's an ingredient being added to a content
                if (data.product && Array.isArray(data.ingredient_units)) {
                    assert(await tx.content.findUnique({ where: { content_id: parentId } }), `Parent content with ID ${parentId} not found for ingredient creation.`, "processRequest:create");
                    newEntity = await handleAtomicIngredientCreate(tx, parentId, data);
                }
                // Check if it's a segment being added to a content
                else if (data.paragraph) {
                    assert(await tx.content.findUnique({ where: { content_id: parentId } }), `Parent content with ID ${parentId} not found for segment creation.`, "processRequest:create");
                    newEntity = await handleAtomicSegmentCreate(tx, parentId, data);
                }
                else {
                    throw new OrchestratorError(`Unknown payload structure for 'create' action.`, "processRequest:create", `payload.${key}`);
                }
                out[parentId] = newEntity;
            }
          } 
          else if (action === "update") {
            assert(data, "Missing payload for update", "processRequest", `payload.${key}`);

            // Case 1: Full, nested publication update
            if (data.publication_id) {
              out[key] = await processor.update(data);
            } 
            // Case 2: Atomic update on a single entity
            else {
              const entityId = key;
              let updatedEntity: any = null;

              if (await tx.ingredient.findUnique({ where: { ingredient_id: entityId } })) {
                updatedEntity = await handleAtomicIngredientUpdate(tx, entityId, data);
              } else if (await tx.segment.findUnique({ where: { segment_id: entityId } })) {
                updatedEntity = await handleAtomicSegmentUpdate(tx, entityId, data);
              } else if (await tx.content.findUnique({ where: { content_id: entityId } })) {
                updatedEntity = await handleAtomicContentUpdate(tx, entityId, data);
              } else if (await tx.publication.findUnique({ where: { publication_id: entityId } })) {
                updatedEntity = await handleAtomicPublicationUpdate(tx, entityId, data);
              } else {
                 throw new OrchestratorError(`Entity with ID ${entityId} not found for atomic update.`, "processRequest:update", `payload.${key}`);
              }

              out[key] = updatedEntity;
            }
          } 
          else if (action === "delete") {
            const entityId = key;
            let deleted = false;
            
            if (await tx.publication.findUnique({ where: { publication_id: entityId } })) {
                await tx.publication.delete({ where: { publication_id: entityId } });
                deleted = true;
            } else if (await tx.content.findUnique({ where: { content_id: entityId } })) {
                await tx.content.delete({ where: { content_id: entityId } });
                deleted = true;
            } else if (await tx.ingredient.findUnique({ where: { ingredient_id: entityId } })) {
                await tx.ingredient.delete({ where: { ingredient_id: entityId } });
                deleted = true;
            } else if (await tx.segment.findUnique({ where: { segment_id: entityId } })) {
                await tx.segment.delete({ where: { segment_id: entityId } });
                deleted = true;
            } else {
                throw new OrchestratorError(`Entity with ID ${entityId} not found for atomic delete.`, "processRequest:delete", `payload.${key}`);
            }

            out[key] = { id: entityId, deleted };
          }
        }
        return out;
      }, {
        maxWait: 15000, // 15 seconds
        timeout: 30000, // 30 seconds
      });

      return { success: true, results: results as any };
    } catch (error: any) {
      logError("transaction", error, { payload });
      return {
        success: false,
        error: error instanceof OrchestratorError ? `[${error.context}] ${error.message}` : "Internal server error",
      };
    }
  }
}

