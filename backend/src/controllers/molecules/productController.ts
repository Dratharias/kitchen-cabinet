import { prisma } from "../../config.js";
import { GenericController } from "types/crud.types.js";
import {
  ProductCore,
  ProductRelations,
  Product,
} from "types/controller.types.js";
import {
  ProductCreateDto,
  ProductUpdateDto,
  ProductConnect,
  ProductSet,
} from "types/dto.types.js";
import { v4 as uuidv4 } from "uuid";
import { Prisma } from "@prisma/client";

export const normalizeProduct = (product: any): Product => ({
  product_id: product.product_id,
  name: product.name,
  is_recipe_id: product.is_recipe_id,
  macro_id: product.macro_id,
  isRecipe: product.isRecipe ?? null,
  macro: product.macro ?? null,
  ingredients: product.ingredients ?? null,
  reviews: product.reviews ?? null,
  product_categories: product.product_categories ?? null,
});

const getFirstConnectId = <T extends { [key: string]: string }>(
  connectArray: T[] | T | undefined,
  idKey: keyof T,
): string | null | undefined => {
  if (!connectArray) return undefined;

  const item = Array.isArray(connectArray) ? connectArray[0] : connectArray;

  return item ? (item[idKey] as string | null) : undefined;
};

export class ProductController
  implements
    GenericController<
      Product,
      ProductCore,
      ProductRelations,
      ProductConnect,
      ProductSet
    >
{
  async create(
    payload: ProductCore & { connect?: ProductCreateDto["connect"] },
  ): Promise<Product> {
    const newId = payload.product_id ?? uuidv4();

    const macro_id =
      payload.macro_id ?? getFirstConnectId(payload.connect?.macro, "macro_id");
    const is_recipe_id =
      payload.is_recipe_id ??
      getFirstConnectId(payload.connect?.isRecipe, "publication_id");

    const product = await prisma.product.create({
      data: {
        product_id: newId,
        name: payload.name,

        macro: macro_id
          ? { connect: { macro_id: macro_id as string } }
          : undefined,
        is_recipe: is_recipe_id
          ? { connect: { publication_id: is_recipe_id as string } }
          : undefined,

        ingredients: payload.connect?.ingredients
          ? { connect: payload.connect.ingredients }
          : undefined,

        reviews: payload.connect?.reviews
          ? { connect: payload.connect.reviews }
          : undefined,

        product_categories: payload.connect?.product_categories
          ? {
              connect: payload.connect.product_categories.map((c) => ({
                product_id_category_id: {
                  product_id: newId,
                  category_id: c.category_id,
                },
              })),
            }
          : undefined,
      },
      include: {
        macro: true,
        is_recipe: true,
        ingredients: true,
        reviews: true,
        product_categories: true,
      },
    });

    return normalizeProduct(product);
  }
  async findById(id: string): Promise<Product | null> {
    const product = await prisma.product.findUnique({
      where: { product_id: id },
      include: {
        macro: true,
        is_recipe: true,
        ingredients: true,
        reviews: true,
        product_categories: true,
      },
    });
    return product ? normalizeProduct(product) : null;
  }

  async findAll(): Promise<Product[]> {
    const products = await prisma.product.findMany({
      include: {
        macro: true,
        is_recipe: true,
        ingredients: false,
        reviews: false,
        product_categories: true,
      },
    });
    return products.map(normalizeProduct);
  }

  async update(id: string, payload: ProductUpdateDto): Promise<Product> {
    const data: Prisma.productUpdateInput = {};

    if (payload.name !== undefined) data.name = payload.name;

    const macroId =
      payload.macro_id ?? getFirstConnectId(payload.connect?.macro, "macro_id");

    if (macroId !== undefined) {
      if (macroId === null) {
        data.macro = { disconnect: true };
      } else {
        data.macro = { connect: { macro_id: macroId as string } };
      }
    } else if (payload.connect?.macro) {
      if (
        payload.connect.macro === null ||
        (Array.isArray(payload.connect.macro) &&
          payload.connect.macro.length === 0)
      ) {
        data.macro = { disconnect: true };
      }
    }

    const isRecipeId =
      payload.is_recipe_id ??
      getFirstConnectId(payload.connect?.isRecipe, "publication_id");

    if (isRecipeId !== undefined) {
      if (isRecipeId === null) {
        data.is_recipe = { disconnect: true };
      } else {
        data.is_recipe = { connect: { publication_id: isRecipeId as string } };
      }
    } else if (payload.connect?.isRecipe) {
      if (
        payload.connect.isRecipe === null ||
        (Array.isArray(payload.connect.isRecipe) &&
          payload.connect.isRecipe.length === 0)
      ) {
        data.is_recipe = { disconnect: true };
      }
    }

    const product = await prisma.product.update({
      where: { product_id: id },
      data: {
        ...data,

        ingredients: payload.connect?.ingredients
          ? { connect: payload.connect.ingredients }
          : payload.set?.ingredients
            ? { set: payload.set.ingredients }
            : undefined,

        reviews: payload.connect?.reviews
          ? { connect: payload.connect.reviews }
          : payload.set?.reviews
            ? { set: payload.set.reviews }
            : undefined,

        product_categories: payload.connect?.product_categories
          ? {
              connect: payload.connect.product_categories.map((c) => ({
                product_id_category_id: {
                  product_id: id,
                  category_id: c.category_id,
                },
              })),
            }
          : payload.set?.product_categories
            ? {
                set: payload.set.product_categories.map((c) => ({
                  product_id_category_id: {
                    product_id: id,
                    category_id: c.category_id,
                  },
                })),
              }
            : undefined,
      },
      include: {
        macro: true,
        is_recipe: true,
        ingredients: true,
        reviews: true,
        product_categories: true,
      },
    });

    return normalizeProduct(product);
  }

  async delete(id: string): Promise<{ deleted: boolean }> {
    await prisma.product.delete({ where: { product_id: id } });
    return { deleted: true };
  }
}
