import { prisma } from "../../config.js";
import { GenericController } from "types/crud.types.js";
import {
  ServingsCore,
  ServingsRelations,
  Servings,
} from "types/controller.types.js";
import {
  ServingsCreateDto,
  ServingsUpdateDto,
  ServingsConnect,
} from "types/dto.types.js";
import { v4 as uuidv4 } from "uuid";
import { Prisma } from "@prisma/client";

// NOTE: Ce contrôleur suppose que les types ServingsCore, ServingsRelations,
// et Servings sont correctement définis dans controller.types.ts et db.types.ts.

export const normalizeServings = (servings: any): Servings => ({
  serving_id: servings.serving_id,
  yield: servings.yield,
  value: servings.value,
  // Ajoutez les relations futures si nécessaire
  content: servings.content ?? null,
});

export class ServingsController
  implements
    GenericController<
      Servings,
      ServingsCore,
      ServingsRelations,
      ServingsConnect,
      ServingsConnect
    >
{
  // =====================================================
  // CREATE
  // =====================================================
  async create(
    payload: ServingsCore & { connect?: ServingsCreateDto["connect"] },
  ): Promise<Servings> {
    const newId = payload.serving_id ?? uuidv4();
    const servings = await prisma.servings.create({
      data: {
        serving_id: newId,
        yield: payload.yield,
        value: payload.value,

        // Connexion Content (relation inverse)
        content: payload.connect?.content
          ? { connect: payload.connect.content }
          : undefined,
      },
      include: {
        content: true,
      },
    });

    return normalizeServings(servings);
  }

  // =====================================================
  // READ
  // =====================================================
  async findById(id: string): Promise<Servings | null> {
    const servings = await prisma.servings.findUnique({
      where: { serving_id: id },
      include: { content: true },
    });
    return servings ? normalizeServings(servings) : null;
  }

  async findAll(): Promise<Servings[]> {
    const servings = await prisma.servings.findMany({
      include: { content: false },
    });
    return servings.map(normalizeServings);
  }

  // =====================================================
  // UPDATE (supporte PUT et PATCH)
  // =====================================================
  async update(id: string, payload: ServingsUpdateDto): Promise<Servings> {
    const data: Prisma.servingsUpdateInput = {};

    // Mappage des champs scalaires (PATCH)
    if (payload.yield !== undefined) data.yield = payload.yield;
    if (payload.value !== undefined) data.value = payload.value;

    const servings = await prisma.servings.update({
      where: { serving_id: id },
      data: {
        ...data,
        content: payload.connect?.content
          ? { connect: payload.connect.content }
          : payload.set?.content
            ? { set: payload.set.content }
            : undefined,
      },
      include: {
        content: true,
      },
    });

    return normalizeServings(servings);
  }

  // =====================================================
  // DELETE
  // =====================================================
  async delete(id: string): Promise<{ deleted: boolean }> {
    await prisma.servings.delete({ where: { serving_id: id } });
    return { deleted: true };
  }
}
