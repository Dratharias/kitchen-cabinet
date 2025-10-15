import { prisma } from "../../config.js";
import { GenericController } from "types/crud.types.js";
import {
  IngredientCore,
  IngredientRelations,
  Ingredient,
} from "types/controller.types.js";
import { IngredientCreateDto, IngredientUpdateDto } from "types/dto.types.js";
import { v4 as uuidv4 } from "uuid";
import { Prisma } from "@prisma/client";

export const normalizeIngredient = (ingredient: any): Ingredient => ({
  ingredient_id: ingredient.ingredient_id,
  quantity: ingredient.quantity,
  product_id: ingredient.product_id,
  multiply_factor: ingredient.multiply_factor,
  title: ingredient.title ?? null,
  cut: ingredient.cut ?? null,

  product: ingredient.product ?? null,
  content_ingredients: ingredient.content_ingredients ?? null,
  ingredient_units: ingredient.ingredient_units ?? null,
});

export class IngredientController
  implements GenericController<Ingredient, IngredientCore, IngredientRelations>
{
  async create(
    payload: IngredientCore & { connect?: IngredientCreateDto["connect"] },
  ): Promise<Ingredient> {
    const newId = payload.ingredient_id ?? uuidv4();
    
    // Simplification: le Product doit être upserté si le nom est fourni
    let productConnect: Prisma.productCreateOrConnectWithoutIngredientsInput | undefined;
    const productPayload = payload.connect?.product?.[0] || payload.product;

    if (productPayload && productPayload.name) {
      productConnect = {
        where: { name: productPayload.name },
        create: { product_id: productPayload.product_id ?? uuidv4(), name: productPayload.name },
      };
    } else if (!payload.product_id) {
        throw new Error("Product name or product_id is required for Ingredient creation.");
    }
    
    // Simplification: les unités doivent être upsertées si le nom est fourni
    let unitConnect: Prisma.ingredient_unitCreateManyIngredientInput[] | undefined;
    const unitPayloads = payload.connect?.ingredient_units || [];

    if (unitPayloads.length > 0) {
        // Pour une approche simple, on ne gère que la première unité fournie
        const unitName = unitPayloads[0].name;

        // Upsert l'unité
        const unit = await prisma.unit.upsert({
            where: { name: unitName },
            update: {},
            create: { unit_id: uuidv4(), name: unitName },
        });

        unitConnect = [{ unit_id: unit.unit_id }];
    }


    const ingredient = await prisma.ingredient.create({
      data: {
        ingredient_id: newId,
        quantity: payload.quantity,
        product_id: payload.product_id, // Si l'ID est fourni (moins prioritaire si productConnect est là)
        multiply_factor: payload.multiply_factor ?? 1,
        title: payload.title,
        cut: payload.cut,
        
        product: productConnect ? { connectOrCreate: productConnect } : undefined, // Upsert ou Connect si Product est fourni
        
        content_ingredients: payload.connect?.content_ingredients
          ? {
              connect: payload.connect.content_ingredients.map((c) => ({
                content_id_ingredient_id: {
                  content_id: c.content_id,
                  ingredient_id: newId,
                },
              })),
            }
          : undefined,

        ingredient_units: unitConnect ? { createMany: { data: unitConnect, skipDuplicates: true } } : undefined,
      },
      include: {
        product: true,
        content_ingredients: true,
        ingredient_units: { include: { unit: true } },
      },
    });

    return normalizeIngredient(ingredient);
  }

  async findById(id: string): Promise<Ingredient | null> {
    const ingredient = await prisma.ingredient.findUnique({
      where: { ingredient_id: id },
      include: {
        product: true,
        content_ingredients: true,
        ingredient_units: true,
      },
    });
    return ingredient ? normalizeIngredient(ingredient) : null;
  }

  async findAll(): Promise<Ingredient[]> {
    const ingredients = await prisma.ingredient.findMany({
      include: {
        product: true,
        content_ingredients: false,
        ingredient_units: true,
      },
    });
    return ingredients.map(normalizeIngredient);
  }

  async update(id: string, payload: IngredientUpdateDto): Promise<Ingredient> {
    const ingredient = await prisma.ingredient.update({
      where: { ingredient_id: id },
      data: {
        quantity: payload.quantity,
        product_id: payload.product_id,
        multiply_factor: payload.multiply_factor,
        title: payload.title,
        cut: payload.cut,

        content_ingredients: payload.connect?.content_ingredients
          ? {
              connect: payload.connect.content_ingredients.map((c) => ({
                content_id_ingredient_id: {
                  ingredient_id: id,
                  content_id: c.content_id,
                },
              })),
            }
          : payload.set?.content_ingredients
            ? {
                set: payload.set.content_ingredients.map((c) => ({
                  content_id_ingredient_id: {
                    ingredient_id: id,
                    content_id: c.content_id,
                  },
                })),
              }
            : undefined,

        ingredient_units: payload.connect?.ingredient_units
          ? {
              connect: payload.connect.ingredient_units.map((u) => ({
                ingredient_id_unit_id: {
                  ingredient_id: id,
                  unit_id: u.unit_id,
                },
              })),
            }
          : payload.set?.ingredient_units
            ? {
                set: payload.set.ingredient_units.map((u) => ({
                  ingredient_id_unit_id: {
                    ingredient_id: id,
                    unit_id: u.unit_id,
                  },
                })),
              }
            : undefined,
      },
      include: {
        product: true,
        content_ingredients: true,
        ingredient_units: true,
      },
    });

    return normalizeIngredient(ingredient);
  }

  async delete(id: string): Promise<{ deleted: boolean }> {
    await prisma.ingredient.delete({ where: { ingredient_id: id } });
    return { deleted: true };
  }
}
