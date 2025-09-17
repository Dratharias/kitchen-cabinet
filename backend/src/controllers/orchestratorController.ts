import { ControllerMap, junctionOrder, GenericController } from "../types/crud.types.js";

export class OrchestratorController {
  constructor(private controllers: ControllerMap) {}

  /**
   * Create a single entity and handle its relations automatically.
   */
  async createEntity<T extends keyof ControllerMap>(
    entityName: T,
    payload: any
  ): Promise<any> {
    const controller = this.controllers[entityName] as GenericController<any, any, any>;
    const created = await controller.create(payload);

    // Handle connect relations
    if (payload.connect) {
      await this.handleRelations(entityName, created, payload.connect, false);
    }

    // Handle set relations
    if (payload.set) {
      await this.handleRelations(entityName, created, payload.set, true);
    }

    return created;
  }

  /**
   * Automatically handle relations for an entity.
   * It detects junction tables from `junctionOrder` and creates the linking entries.
   */
  private async handleRelations(
    entityName: keyof ControllerMap,
    createdEntity: any,
    relations: Record<string, any>,
    replace = false
  ) {
    for (const [relationKey, items] of Object.entries(relations)) {
      if (!items) continue;

      // Find junction table for entityName -> relationKey
      const junctionName = junctionOrder.find(
        j => j.includes(entityName) && j.includes(relationKey)
      );
      if (!junctionName) continue;

      const junctionController = this.controllers[junctionName as keyof ControllerMap] as GenericController<any, any, any>;
      if (!junctionController) continue;

      const itemArray = Array.isArray(items) ? items : [items];

      for (const item of itemArray) {
        // Construct payload for junction table automatically
        const junctionPayload: any = {
          [`${entityName}_id`]: createdEntity.id ?? createdEntity[`${entityName}_id`],
          [`${relationKey}_id`]: item.id ?? item[`${relationKey}_id`] ?? item
        };
        await junctionController.create(junctionPayload);
      }

      console.log(`[Orchestrator] Linked ${entityName} -> ${relationKey} via ${junctionName}`, itemArray);
    }
  }

  /**
   * Create all entities in the proper order.
   */
  async createAllEntities(entityPayloads: Partial<Record<keyof ControllerMap, any[]>>) {
    // Define creation order for entities
    const creationOrder: (keyof ControllerMap)[] = [
      "categories", "macros", "prepTimes", "segments", "units",
      "ingredients", "products",
      "users", "contents", "publications", "reviews"
    ];

    const results: Partial<Record<keyof ControllerMap, any[]>> = {};

    // Create all entities first
    for (const entity of creationOrder) {
      const payloads = entityPayloads[entity];
      if (!payloads || payloads.length === 0) continue;

      results[entity] = [];
      for (const payload of payloads) {
        const created = await this.createEntity(entity, payload);
        results[entity].push(created);
      }
    }

    // Handle junction tables not covered by `connect`/`set` (optional)
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
