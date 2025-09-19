import { v4 as uuidv4 } from "uuid";
import { ControllerMap, GenericController } from "../types/crud.types.js";
import { OrchestratorRequest, OrchestratorResponse } from "../types/orchestrator.types.js";
import { prisma } from "../config.js";

export class OrchestratorController {
  private junctionOrder = [
    "contentIngredients",
    "contentPrepTimes",
    "contentSegments",
    "segmentPrepTimes",
    "ingredientUnits",
    "productCategories",
    "publicationTags"
  ];

  private junctionTableMap: Record<string, string> = {
    "contentIngredients": "content_ingredient",
    "contentPrepTimes": "content_prep_time",
    "contentSegments": "content_segment",
    "segmentPrepTimes": "segment_prep_time",
    "ingredientUnits": "ingredient_unit",
    "productCategories": "product_category",
    "publicationTags": "publication_tag"
  };

  private idFieldMap: Record<keyof ControllerMap, string> = {
    users: 'user_id',
    categories: 'category_id',
    products: 'product_id',
    ingredients: 'ingredient_id',
    macros: 'macro_id',
    units: 'unit_id',
    prepTimes: 'prep_time_id',
    segments: 'segment_id',
    contents: 'content_id',
    publications: 'publication_id',
    reviews: 'review_id',
  };

  constructor(private controllers: ControllerMap) {}

  private getIdField(entityType: keyof ControllerMap): string {
    const idField = this.idFieldMap[entityType];
    if (!idField) {
      throw new Error(`Unknown entity type: ${entityType}. ID field not found.`);
    }
    return idField;
  }

  async execute(request: OrchestratorRequest): Promise<OrchestratorResponse> {
    try {
      const results: Record<string, any[]> = {};
      const entityMap: Record<string, Record<string, string>> = {};

      // Phase 1: traiter toutes les entités simples sauf junctions
      for (const [entityType, payloads] of Object.entries(request)) {
        if (
          entityType === "action" ||
          !payloads ||
          this.junctionOrder.includes(entityType) ||
          (Array.isArray(payloads) && payloads.length === 0)
        ) {
          continue;
        }

        await this.processEntity(entityType, payloads, request.action, results, entityMap);
      }

      // Phase 2: gérer les tables de jointure
      if (request.action === "create") {
        await this.processJunctions(entityMap);
      }

      return { success: true, results };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred"
      };
    }
  }

  private async processEntity(
    entityType: string,
    payloads: any,
    action: string,
    results: Record<string, any[]>,
    entityMap: Record<string, Record<string, string>>
  ): Promise<void> {
    const controller = this.controllers[entityType as keyof ControllerMap];
    if (!controller) {
      throw new Error(`Controller not found for entity: ${entityType}`);
    }

    results[entityType] = [];
    entityMap[entityType] = {};

    const payloadArray = Array.isArray(payloads) ? payloads : [payloads];

    for (const payload of payloadArray) {
      let result: any;

      switch (action) {
      case "create": {
        let createData = { ...payload.data };

        if (entityType === "review") {
          // on conserve les IDs fournis
          result = await controller.create(createData);
        } else if (entityType === "product") {
          // vérifier existence par nom insensible à la casse
          const existing = await prisma.product.findFirst({
            where: { name: { equals: createData.name, mode: "insensitive" } }
          });

          result = existing ? existing : await controller.create({ ...createData, product_id: uuidv4() });
        } else if (entityType === "category") {
          const existing = await prisma.category.findFirst({
            where: {
              str_value: { equals: createData.str_value, mode: "insensitive" },
              type: { equals: createData.type, mode: "insensitive" }
            }
          });

          result = existing ? existing : await controller.create({ ...createData, unit_id: uuidv4() });
        } else if (entityType === "unit") {
          const existing = await prisma.unit.findFirst({
            where: {
              name: { equals: createData.name, mode: "insensitive" },
            }
          });

          result = existing ? existing : await controller.create({ ...createData, unit_id: uuidv4() });
        } else {
          // logique standard avec nouvel id
          const newId = uuidv4();
          // remplacer le champ id spécifique (comme avant)
          result = await controller.create({ ...createData, [this.getIdField(entityType as keyof ControllerMap)]: newId });

          if (payload.id) {
            entityMap[entityType][payload.id] = newId;
          }
        }
        break;
      }


        case "read":
          if (!payload.id) throw new Error(`ID required for read action on ${entityType}`);
          result = await controller.findById(payload.id);
          break;

        case "readAll":
          result = await controller.findAll(payload.data as any);
          break;

          case "update": {
            const payloadData = payload.data;

            if (!payload.id) {
              // Handle upsert logic for entities with unique fields
              if (entityType === "product") {
                result = await prisma.product.upsert({
                  where: {
                    name: payloadData.name.toLowerCase()
                  },
                  update: payloadData,
                  create: {
                    ...payloadData,
                    product_id: uuidv4()
                  }
                });
              } else if (entityType === "category") {
                result = await prisma.category.upsert({
                  where: {
                    str_value_type: { // Make sure this is a unique composite index in your schema
                      str_value: payloadData.str_value.toLowerCase(),
                      type: payloadData.type.toLowerCase()
                    }
                  },
                  update: payloadData,
                  create: {
                    ...payloadData,
                    category_id: uuidv4()
                  }
                });
              } else if (entityType === "unit") {
                result = await prisma.unit.upsert({
                  where: {
                    name: payloadData.name.toLowerCase()
                  },
                  update: payloadData,
                  create: {
                    ...payloadData,
                    unit_id: uuidv4()
                  }
                });
              } else {
                // Standard update for entities that require an ID
                throw new Error(`ID is required for the update action on ${entityType}`);
              }
            } else {
              // Standard update using the provided ID
              const controller = this.controllers[entityType as keyof ControllerMap];
              result = await controller.update(payload.id, payloadData);
            }
            break;
          }


        case "delete":
          if (!payload.id) throw new Error(`ID required for delete action on ${entityType}`);
          result = await controller.delete(payload.id);
          break;

        default:
          throw new Error(`Unknown action: ${action}`);
      }

      results[entityType].push(result);
    }
  }

  private async processJunctions(entityMap: Record<string, Record<string, string>>): Promise<void> {
    for (const junctionType of this.junctionOrder) {
      const tableName = this.junctionTableMap[junctionType];
      if (!tableName) continue;

      switch (junctionType) {
        case "contentIngredients":
          await this.insertContentIngredients(entityMap);
          break;
        case "contentPrepTimes":
          await this.insertContentPrepTimes(entityMap);
          break;
        case "contentSegments":
          await this.insertContentSegments(entityMap);
          break;
        case "segmentPrepTimes":
          await this.insertSegmentPrepTimes(entityMap);
          break;
        case "ingredientUnits":
          await this.insertIngredientUnits(entityMap);
          break;
        case "productCategories":
          await this.insertProductCategories(entityMap);
          break;
        case "publicationTags":
          await this.insertPublicationTags(entityMap);
          break;
      }
    }
  }

  private async insertContentIngredients(entityMap: Record<string, Record<string, string>>): Promise<void> {
    const contentIds = Object.values(entityMap.contents || {});
    const ingredientIds = Object.values(entityMap.ingredients || {});

    for (const contentId of contentIds) {
      for (const ingredientId of ingredientIds) {
        await prisma.content_ingredient.create({
          data: { content_id: contentId, ingredient_id: ingredientId }
        });
      }
    }
  }

  private async insertContentPrepTimes(entityMap: Record<string, Record<string, string>>): Promise<void> {
    const contentIds = Object.values(entityMap.contents || {});
    const prepTimeIds = Object.values(entityMap.prepTimes || {});

    for (const contentId of contentIds) {
      for (const prepTimeId of prepTimeIds) {
        await prisma.content_prep_time.create({
          data: { content_id: contentId, prep_time_id: prepTimeId }
        });
      }
    }
  }

  private async insertContentSegments(entityMap: Record<string, Record<string, string>>): Promise<void> {
    const contentIds = Object.values(entityMap.contents || {});
    const segmentIds = Object.values(entityMap.segments || {});

    for (const contentId of contentIds) {
      for (const segmentId of segmentIds) {
        await prisma.content_segment.create({
          data: { content_id: contentId, segment_id: segmentId, position: null }
        });
      }
    }
  }

  private async insertSegmentPrepTimes(entityMap: Record<string, Record<string, string>>): Promise<void> {
    const segmentIds = Object.values(entityMap.segments || {});
    const prepTimeIds = Object.values(entityMap.prepTimes || {});

    for (const segmentId of segmentIds) {
      for (const prepTimeId of prepTimeIds) {
        await prisma.segment_prep_time.create({
          data: { segment_id: segmentId, prep_time_id: prepTimeId }
        });
      }
    }
  }

  private async insertIngredientUnits(entityMap: Record<string, Record<string, string>>): Promise<void> {
    const ingredientIds = Object.values(entityMap.ingredients || {});
    const unitIds = Object.values(entityMap.units || {});

    for (const ingredientId of ingredientIds) {
      for (const unitId of unitIds) {
        await prisma.ingredient_unit.create({
          data: { ingredient_id: ingredientId, unit_id: unitId }
        });
      }
    }
  }

  private async insertProductCategories(entityMap: Record<string, Record<string, string>>): Promise<void> {
    const productIds = Object.values(entityMap.products || {});
    const categoryIds = Object.values(entityMap.categories || {});

    for (const productId of productIds) {
      for (const categoryId of categoryIds) {
        await prisma.product_category.create({
          data: { product_id: productId, category_id: categoryId }
        });
      }
    }
  }

  private async insertPublicationTags(entityMap: Record<string, Record<string, string>>): Promise<void> {
    const publicationIds = Object.values(entityMap.publications || {});
    const categoryIds = Object.values(entityMap.categories || {});

    for (const publicationId of publicationIds) {
      for (const categoryId of categoryIds) {
        await prisma.publication_tag.create({
          data: { publication_id: publicationId, category_id: categoryId }
        });
      }
    }
  }

  async createEntity<T extends keyof ControllerMap>(entityName: T, payload: any): Promise<any> {
    const controller = this.controllers[entityName] as GenericController<any, any, any>;
    return await controller.create(payload);
  }
}
