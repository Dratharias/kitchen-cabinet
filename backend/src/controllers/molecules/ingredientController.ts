import { prisma } from "../../config.js";
import { GenericController } from "types/crud.types.js";
import {
  IngredientCore,
  IngredientRelations,
  Ingredient,
} from "types/controller.types.js";
import { IngredientCreateDto, IngredientUpdateDto, IngredientConnect } from "types/dto.types.js";
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
  implements GenericController<Ingredient, IngredientCore, IngredientRelations, IngredientConnect, IngredientConnect>
{
  async create(
    payload: IngredientCreateDto,
  ): Promise<Ingredient> {
    const newId = payload.ingredient_id ?? uuidv4();
    
    const productPayload = payload.connect?.product?.[0] || (payload.product as any);
    
    let productConnect: Prisma.productCreateOrConnectWithoutIngredientsInput | undefined;
    let product_id: string | undefined = payload.product_id;

    const productName = (productPayload as any)?.name; 

    if (productName) {
        productConnect = {
            where: { name: productName },
            create: { product_id: productPayload.product_id ?? uuidv4(), name: productName },
        };
        product_id = undefined; 
    } else if (productPayload?.product_id) {
        product_id = productPayload.product_id;
    } else if (!product_id) {
        throw new Error("Product name or product_id is required for Ingredient creation.");
    }
    
    let unitConnectData: { unit_id: string }[] | undefined;

    if (payload.connect?.ingredient_units?.length) {
        const unitToProcess = payload.connect.ingredient_units[0]; 
        let unitId = unitToProcess.unit_id;
        
        if (unitToProcess.name) {
            const upsertedUnit = await prisma.unit.upsert({
                where: { name: unitToProcess.name },
                update: {},
                create: { unit_id: uuidv4(), name: unitToProcess.name },
            });
            unitId = upsertedUnit.unit_id;
        }

        if (unitId) {
            unitConnectData = [{ unit_id: unitId }];
        }
    }

    let dataToCreate: Prisma.ingredientCreateInput;

    if (productConnect) {
        dataToCreate = {
            ingredient_id: newId,
            quantity: payload.quantity,
            multiply_factor: payload.multiply_factor ?? 1,
            title: payload.title,
            cut: payload.cut,
            product: { connectOrCreate: productConnect },
        };
    } else if (product_id) {
        dataToCreate = {
            ingredient_id: newId,
            quantity: payload.quantity,
            multiply_factor: payload.multiply_factor ?? 1,
            title: payload.title,
            cut: payload.cut,
            product: { connect: { product_id: product_id } },
        };
    } else {
        throw new Error("Missing product reference for ingredient.");
    }

    
    const ingredient = await prisma.ingredient.create({
      data: {
        ...dataToCreate,
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

        ingredient_units: unitConnectData ? { createMany: { data: unitConnectData, skipDuplicates: true } } : undefined,
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
    
    const product_id_from_connect = payload.connect?.product?.[0]?.product_id;
    const productRelationProvided = payload.connect?.product || payload.set?.product;

    const data: Prisma.ingredientUpdateInput = {};
    if (payload.quantity !== undefined) data.quantity = payload.quantity;
    if (payload.multiply_factor !== undefined) data.multiply_factor = payload.multiply_factor;
    if (payload.title !== undefined) data.title = payload.title;
    if (payload.cut !== undefined) data.cut = payload.cut;
    
    if (productRelationProvided) {
        if (product_id_from_connect !== undefined) {
             data.product = { connect: { product_id: product_id_from_connect } };
        } else if (payload.product_id !== undefined) {
             data.product = { connect: { product_id: payload.product_id } };
        }
    } else if (payload.product_id !== undefined) {
        data.product = { connect: { product_id: payload.product_id } };
    }


    const ingredient = await prisma.ingredient.update({
      where: { ingredient_id: id },
      data: {
        ...data,

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
