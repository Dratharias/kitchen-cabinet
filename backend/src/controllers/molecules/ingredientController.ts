import { PrismaClient } from "@prisma/client";
import { GenericController } from "types/crud.types.js";
import { IngredientCore, IngredientRelations, Ingredient } from "types/controller.types.js";
import { IngredientCreateDto, IngredientUpdateDto } from "types/dto.types.js";
import { v4 as uuidv4 } from "uuid";

const prisma = new PrismaClient();

export const normalizeIngredient = (ingredient: any): Ingredient => ({
  ingredient_id: ingredient.ingredient_id,
  quantity: ingredient.quantity,
  is_recipe_id: ingredient.is_recipe_id,
  product_id: ingredient.product_id,
  multiply_factor: ingredient.multiply_factor,

  product: ingredient.product ?? null,
  isRecipe: ingredient.isRecipe ?? null,
  content_ingredients: ingredient.content_ingredients ?? null,
  ingredient_units: ingredient.ingredient_units ?? null,
});

export class IngredientController
  implements GenericController<Ingredient, IngredientCore, IngredientRelations>
{
  async create(payload: IngredientCore & { connect?: IngredientCreateDto["connect"] }): Promise<Ingredient> {
    const newId = uuidv4();
    const ingredient = await prisma.ingredient.create({
      data: {
        ingredient_id: newId,
        quantity: payload.quantity,
        is_recipe_id: payload.is_recipe_id,
        product_id: payload.product_id,
        multiply_factor: payload.multiply_factor ?? 1,

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

        ingredient_units: payload.connect?.ingredient_units
          ? {
              connect: payload.connect.ingredient_units.map((u) => ({
                ingredient_id_unit_id: {
                  ingredient_id: newId,
                  unit_id: u.unit_id,
                },
              })),
            }
          : undefined,
      },
      include: {
        product: true,
        isRecipe: true,
        content_ingredients: true,
        ingredient_units: true,
      },
    });

    return normalizeIngredient(ingredient);
  }

  async findById(id: string): Promise<Ingredient | null> {
    const ingredient = await prisma.ingredient.findUnique({
      where: { ingredient_id: id },
      include: {
        product: true,
        isRecipe: true,
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
        isRecipe: false,
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
          is_recipe_id: payload.is_recipe_id,
          product_id: payload.product_id,
          multiply_factor: payload.multiply_factor,

          content_ingredients: payload.connect?.content_ingredients
              ? {
                  connect: payload.connect.content_ingredients.map((c) => ({
                  content_id_ingredient_id: { ingredient_id: id, content_id: c.content_id },
                  })),
              }
              : payload.set?.content_ingredients
              ? {
                  set: payload.set.content_ingredients.map((c) => ({
                  content_id_ingredient_id: { ingredient_id: id, content_id: c.content_id },
                  })),
              }
              : undefined,

          ingredient_units: payload.connect?.ingredient_units
              ? {
                  connect: payload.connect.ingredient_units.map((u) => ({
                  ingredient_id_unit_id: { ingredient_id: id, unit_id: u.unit_id },
                  })),
              }
              : payload.set?.ingredient_units
              ? {
                  set: payload.set.ingredient_units.map((u) => ({
                  ingredient_id_unit_id: { ingredient_id: id, unit_id: u.unit_id },
                  })),
              }
              : undefined,
        },
        include: {
        product: true,
        isRecipe: true,
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