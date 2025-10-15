import { prisma } from "../../config.js";
import { GenericController } from "types/crud.types.js";
import { Macro } from "types/controller.types.js";
import { MacroCreateDto, MacroUpdateDto } from "types/dto.types.js";
import { v4 as uuidv4 } from "uuid";
import { Prisma } from "@prisma/client";

export const normalizeMacro = (macro: any): Macro => ({
  macro_id: macro.macro_id,
  calories: macro.calories,
  protein: macro.protein,
  fiber: macro.fiber,
  sugar: macro.sugar,
  saturated: macro.saturated,
  trans: macro.trans,
  caffein: macro.caffein,
  alcohol: macro.alcohol,

  products: macro.products ?? null,
});

export class MacroController
  implements
    GenericController<
      Macro,
      Omit<Macro, "macro_id" | "products">,
      Partial<Pick<Macro, "products">>
    >
{
  // =====================================================
  // CREATE
  // =====================================================
  async create(
    payload: Omit<Macro, "macro_id" | "products"> & {
      connect?: MacroCreateDto["connect"];
    },
  ): Promise<Macro> {
    const newId = uuidv4();
    const macro = await prisma.macro.create({
      data: {
        macro_id: newId,
        calories: payload.calories,
        protein: payload.protein,
        fiber: payload.fiber,
        sugar: payload.sugar,
        saturated: payload.saturated,
        trans: payload.trans,
        caffein: payload.caffein,
        alcohol: payload.alcohol,

        products: payload.connect?.products
          ? { connect: payload.connect.products }
          : undefined,
      },
      include: {
        products: true,
      },
    });

    return normalizeMacro(macro);
  }

  // =====================================================
  // READ
  // =====================================================
  async findById(id: string): Promise<Macro | null> {
    const macro = await prisma.macro.findUnique({ where: { macro_id: id } });
    return macro ? normalizeMacro(macro) : null;
  }

  async findAll(): Promise<Macro[]> {
    const macros = await prisma.macro.findMany();
    return macros.map(normalizeMacro);
  }

  // =====================================================
  // UPDATE (supporte PUT et PATCH)
  // =====================================================
  async update(id: string, payload: MacroUpdateDto): Promise<Macro> {
    const data: Prisma.macroUpdateInput = {};

    if (payload.calories !== undefined) data.calories = payload.calories;
    if (payload.protein !== undefined) data.protein = payload.protein;
    if (payload.fiber !== undefined) data.fiber = payload.fiber;
    if (payload.sugar !== undefined) data.sugar = payload.sugar;
    if (payload.saturated !== undefined) data.saturated = payload.saturated;
    if (payload.trans !== undefined) data.trans = payload.trans;
    if (payload.caffein !== undefined) data.caffein = payload.caffein;
    if (payload.alcohol !== undefined) data.alcohol = payload.alcohol;

    const macro = await prisma.macro.update({
      where: { macro_id: id },
      data: {
        ...data,
        products: payload.connect?.products
          ? { connect: payload.connect.products }
          : payload.set?.products
            ? { set: payload.set.products }
            : undefined,
      },
      include: {
        products: true,
      },
    });

    return normalizeMacro(macro);
  }

  // =====================================================
  // DELETE
  // =====================================================
  async delete(id: string): Promise<{ deleted: boolean }> {
    await prisma.macro.delete({ where: { macro_id: id } });
    return { deleted: true };
  }
}
