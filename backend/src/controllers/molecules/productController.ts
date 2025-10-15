import { prisma } from "../../config.js";
import { GenericController } from "types/crud.types.js";
import {
  ProductCore,
  ProductRelations,
  Product,
} from "types/controller.types.js";
import { ProductCreateDto, ProductUpdateDto } from "types/dto.types.js";
import { v4 as uuidv4 } from "uuid";

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

export class ProductController
  implements GenericController<Product, ProductCore, ProductRelations>
{
  async create(
    payload: ProductCore & { connect?: ProductCreateDto["connect"] },
  ): Promise<Product> {
    const newId = uuidv4();
    const product = await prisma.product.create({
      data: {
        product_id: newId,
        name: payload.name,
        // Correction: Remove `macro_id` and use the `macro` relation.
        macro: payload.connect?.macro
          ? { connect: { macro_id: payload.connect.macro.macro_id } }
          : undefined,
        // Correction: Remove `is_recipe_id` and use the `isRecipe` relation.
        isRecipe: payload.connect?.isRecipe
          ? {
              connect: {
                publication_id: payload.connect.isRecipe.publication_id,
              },
            }
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
        ingredients: true,
        reviews: true,
        isRecipe: true,
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
        ingredients: true,
        reviews: true,
        isRecipe: true,
        product_categories: true,
      },
    });
    return product ? normalizeProduct(product) : null;
  }

  async findAll(): Promise<Product[]> {
    const products = await prisma.product.findMany({
      include: {
        macro: true,
        ingredients: false,
        reviews: false,
        isRecipe: true,
        product_categories: true,
      },
    });
    return products.map(normalizeProduct);
  }

  async update(id: string, payload: ProductUpdateDto): Promise<Product> {
    const product = await prisma.product.update({
      where: { product_id: id },
      data: {
        name: payload.name,
        // Correction: Remove `macro_id` and use the `macro` relation.
        macro: payload.connect?.macro
          ? { connect: { macro_id: payload.connect.macro.macro_id } }
          : undefined,
        // Correction: Remove `is_recipe_id` and use the `isRecipe` relation.
        isRecipe: payload.connect?.isRecipe
          ? {
              connect: {
                publication_id: payload.connect.isRecipe.publication_id,
              },
            }
          : undefined,

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
        ingredients: true,
        reviews: true,
        isRecipe: true,
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
