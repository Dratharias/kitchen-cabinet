import { prisma } from "../../config.js";
import { GenericController } from "types/crud.types.js";
import {
  Category,
  CategoryCore,
  CategoryRelations,
} from "types/controller.types.js";
import { v4 as uuidv4 } from "uuid";
import { CategoryCreateDto, CategoryUpdateDto } from "types/dto.types.js";
import { ReadAllParams } from "types/db.types.js";

export function normalizeCategory(cat: any): Category {
  return {
    category_id: cat.category_id,
    str_value: cat.str_value,
    type: cat.type,
    // pas de relations incluses
    publications_type: null,
    publications_style: null,
    publications_author: null,
    prep_time: null,
    publication_tags: null,
    product_categories: null,
  };
}

export class CategoryController
  implements GenericController<Category, CategoryCore, CategoryRelations>
{
  async create(
    payload: CategoryCore & {
      connect?: CategoryCreateDto["connect"];
    },
  ): Promise<Category> {
    const category = await prisma.category.create({
      data: {
        category_id: uuidv4(),
        str_value: payload.str_value,
        type: payload.type,

        publications_type: payload.connect?.publications_type
          ? { connect: payload.connect.publications_type }
          : undefined,

        publications_style: payload.connect?.publications_style
          ? { connect: payload.connect.publications_style }
          : undefined,

        publications_author: payload.connect?.publications_author
          ? { connect: payload.connect.publications_author }
          : undefined,

        prep_time: payload.connect?.prep_time
          ? { connect: payload.connect.prep_time }
          : undefined,

        publication_tags: payload.connect?.publication_tags
          ? {
              connect: payload.connect.publication_tags.map((pt) => ({
                publication_id_category_id: {
                  category_id: pt.category_id,
                  publication_id: pt.publication_id,
                },
              })),
            }
          : undefined,

        product_categories: payload.connect?.product_categories
          ? {
              connect: payload.connect.product_categories.map((pc) => ({
                product_id_category_id: {
                  product_id: pc.product_id,
                  category_id: pc.category_id,
                },
              })),
            }
          : undefined,
      },
    });

    return normalizeCategory(category);
  }

  async findById(id: string): Promise<Category | null> {
    const category = await prisma.category.findUnique({
      where: { category_id: id },
    });
    return category ? normalizeCategory(category) : null;
  }

  async findAll(params?: ReadAllParams<Category>): Promise<Category[]> {
    const where: any = {};

    if (params?.filter) {
      const filter = params.filter as any;

      if (filter.type) {
        where.type = Array.isArray(filter.type)
          ? { in: filter.type }
          : filter.type;
      }

      if (filter.str_value) {
        where.str_value = Array.isArray(filter.str_value)
          ? { in: filter.str_value }
          : filter.str_value;
      }
    }

    const categories = await prisma.category.findMany({
      where,
      skip: params?.skip,
      take: params?.take,
    });

    return categories.map(normalizeCategory);
  }

  async update(id: string, payload: CategoryUpdateDto): Promise<Category> {
    const category = await prisma.category.update({
      where: { category_id: id },
      data: {
        str_value: payload.str_value,
        type: payload.type,
        publications_type: payload.connect?.publications_type
          ? { connect: payload.connect.publications_type }
          : payload.set?.publications_type
            ? { set: payload.set.publications_type }
            : undefined,
        publications_style: payload.connect?.publications_style
          ? { connect: payload.connect.publications_style }
          : payload.set?.publications_style
            ? { set: payload.set.publications_style }
            : undefined,
        publications_author: payload.connect?.publications_author
          ? { connect: payload.connect.publications_author }
          : payload.set?.publications_author
            ? { set: payload.set.publications_author }
            : undefined,
        prep_time: payload.connect?.prep_time
          ? { connect: payload.connect.prep_time }
          : payload.set?.prep_time
            ? { set: payload.set.prep_time }
            : undefined,
        publication_tags: payload.connect?.publication_tags
          ? {
              connect: payload.connect.publication_tags.map((pt) => ({
                publication_id_category_id: {
                  category_id: pt.category_id,
                  publication_id: pt.publication_id,
                },
              })),
            }
          : payload.set?.publication_tags
            ? {
                set: payload.set.publication_tags.map((pt) => ({
                  publication_id_category_id: {
                    category_id: pt.category_id,
                    publication_id: pt.publication_id,
                  },
                })),
              }
            : undefined,
        product_categories: payload.connect?.product_categories
          ? {
              connect: payload.connect.product_categories.map((pc) => ({
                product_id_category_id: {
                  product_id: pc.product_id,
                  category_id: pc.category_id,
                },
              })),
            }
          : payload.set?.product_categories
            ? {
                set: payload.set.product_categories.map((pc) => ({
                  product_id_category_id: {
                    product_id: pc.product_id,
                    category_id: pc.category_id,
                  },
                })),
              }
            : undefined,
      },
    });

    return normalizeCategory(category);
  }

  async delete(id: string): Promise<{ deleted: boolean }> {
    await prisma.category.delete({ where: { category_id: id } });
    return { deleted: true };
  }
}
