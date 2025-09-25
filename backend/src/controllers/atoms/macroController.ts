import { prisma } from "../../config.js";
import { GenericController } from "types/crud.types.js";
import { Macro } from "types/controller.types.js";
import { MacroCreateDto, MacroUpdateDto } from "types/dto.types.js";
import { v4 as uuidv4 } from "uuid";

export const normalizeMacro = (macro: any): Macro => ({
  macro_id: macro.macro_id,
  calories: macro.calories,
  protein: macro.protein,
  fiber: macro.fiber,
  sugar: macro.sugar,
  saturated: macro.saturated,
  trans: macro.trans,
  caffein: macro.caffein,

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

  async findById(id: string): Promise<Macro | null> {
    const macro = await prisma.macro.findUnique({
      where: { macro_id: id },
      include: {
        products: true,
      },
    });
    return macro ? normalizeMacro(macro) : null;
  }

  async findAll(): Promise<Macro[]> {
    const macros = await prisma.macro.findMany({
      include: {
        products: false,
      },
    });
    return macros.map(normalizeMacro);
  }

  async update(id: string, payload: MacroUpdateDto): Promise<Macro> {
    const macro = await prisma.macro.update({
      where: { macro_id: id },
      data: {
        calories: payload.calories,
        protein: payload.protein,
        fiber: payload.fiber,
        sugar: payload.sugar,
        saturated: payload.saturated,
        trans: payload.trans,
        caffein: payload.caffein,

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

  async delete(id: string): Promise<{ deleted: boolean }> {
    await prisma.macro.delete({ where: { macro_id: id } });
    return { deleted: true };
  }
}
