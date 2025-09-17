import { PrismaClient } from "@prisma/client";
import { GenericController } from "types/crud.types.js";
import { IngredientUnit, Unit } from "types/controller.types.js";
import { UnitCreateDto, UnitUpdateDto } from "types/dto.types.js";
import { v4 as uuidv4 } from "uuid";

const prisma = new PrismaClient();

export const normalizeUnit = (unit: any): Unit => ({
  unit_id: unit.unit_id,
  name: unit.name,
  ingredient_units: unit.ingredient_units ?? null,
});

export class UnitController implements GenericController<Unit, Omit<Unit, "ingredient_units">, { ingredient_units: IngredientUnit[] | null }> {

  async create(payload: Omit<Unit, "ingredient_units"> & { connect?: UnitCreateDto["connect"] }): Promise<Unit> {
    const newId = uuidv4();
    const unit = await prisma.unit.create({
      data: {
        unit_id: newId,
        name: payload.name,
        ingredient_units: payload.connect?.ingredient_units
          ? {
              connect: payload.connect.ingredient_units.map(iu => ({
                ingredient_id_unit_id: { unit_id: newId, ingredient_id: iu.ingredient_id },
              })),
            }
          : undefined,
      },
      include: {
        ingredient_units: true,
      },
    });
    return normalizeUnit(unit);
  }

  async findById(id: string): Promise<Unit | null> {
    const unit = await prisma.unit.findUnique({
      where: { unit_id: id },
      include: { ingredient_units: true },
    });
    return unit ? normalizeUnit(unit) : null;
  }

  async findAll(): Promise<Unit[]> {
    const units = await prisma.unit.findMany({
      include: { ingredient_units: true },
    });
    return units.map(normalizeUnit);
  }

  async update(id: string, payload: UnitUpdateDto): Promise<Unit> {
    const unit = await prisma.unit.update({
      where: { unit_id: id },
      data: {
        name: payload.name,
        ingredient_units: payload.connect?.ingredient_units
          ? { connect: payload.connect.ingredient_units.map(iu => ({ ingredient_id_unit_id: { unit_id: id, ingredient_id: iu.ingredient_id } })) }
          : payload.set?.ingredient_units
          ? { set: payload.set.ingredient_units.map(iu => ({ ingredient_id_unit_id: { unit_id: id, ingredient_id: iu.ingredient_id } })) }
          : undefined,
      },
      include: { ingredient_units: true },
    });
    return normalizeUnit(unit);
  }

  async delete(id: string): Promise<{ deleted: boolean }> {
    await prisma.unit.delete({ where: { unit_id: id } });
    return { deleted: true };
  }
}
