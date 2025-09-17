import { ControllerMap, junctionOrder, GenericController } from "../types/crud.types.js";

export class OrchestratorController {
  constructor(private controllers: ControllerMap) {}

  async createEntity<T extends keyof ControllerMap>(
    entityName: T,
    payload: any
  ): Promise<any> {
    const controller = this.controllers[entityName] as GenericController<any, any, any>;
    const created = await controller.create(payload);

    if (payload.connect) {
      await this.handleRelations(entityName, created, payload.connect, false);
    }

    if (payload.set) {
      await this.handleRelations(entityName, created, payload.set, true);
    }

    return created;
  }

  async handleRelations(
    entityName: keyof ControllerMap,
    createdEntity: any,
    relations: Record<string, any>,
    replace = false
  ) {
    for (const [relationKey, items] of Object.entries(relations)) {
      if (!items) continue;

      const junctionName = junctionOrder.find(
        j => j.includes(entityName) && j.includes(relationKey)
      );
      if (!junctionName) continue;

      const junctionController = this.controllers[junctionName as keyof ControllerMap] as GenericController<any, any, any>;
      if (!junctionController) continue;

      const itemArray = Array.isArray(items) ? items : [items];

      for (const item of itemArray) {
        let relatedEntityId: string;
        if (typeof item === 'string') {
          relatedEntityId = item;
        } else if (item.id || item[`${relationKey}_id`]) {
          relatedEntityId = item.id ?? item[`${relationKey}_id`];
        } else {
          // Item is a payload - create the related entity first
          const relatedController = this.controllers[relationKey as keyof ControllerMap] as GenericController<any, any, any>;
          const createdRelated = await relatedController.create(item);
          relatedEntityId = createdRelated.id ?? createdRelated[`${relationKey}_id`];
        }

        const junctionPayload: any = {
          [`${entityName}_id`]: createdEntity.id ?? createdEntity[`${entityName}_id`],
          [`${relationKey}_id`]: relatedEntityId
        };
        await junctionController.create(junctionPayload);
      }

      console.log(`[Orchestrator] Linked ${entityName} -> ${relationKey} via ${junctionName}`, itemArray);
    }
  }

  async createAllEntities(entityPayloads: Partial<Record<keyof ControllerMap, any[]>>) {
    const creationOrder: (keyof ControllerMap)[] = [
      "categories", "macros", "prepTimes", "segments", "units",
      "ingredients", "products",
      "users", "contents", "publications", "reviews"
    ];

    const results: Partial<Record<keyof ControllerMap, any[]>> = {};

    for (const entity of creationOrder) {
      const payloads = entityPayloads[entity];
      if (!payloads || payloads.length === 0) continue;

      results[entity] = [];
      for (const payload of payloads) {
        const created = await this.createEntity(entity, payload);
        results[entity].push(created);
      }
    }

    const validJunctions = junctionOrder.filter((j): j is keyof ControllerMap => j in this.controllers);

    for (const junction of validJunctions) {
      const payloads = entityPayloads[junction];
      if (!payloads || payloads.length === 0) continue;

      const junctionController = this.controllers[junction];
      if (!junctionController) continue;

      for (const payload of payloads) {
        await junctionController.create(payload);
      }
    }

    return results;
  }
}