import { prisma } from "../../config.js";
import { GenericController } from "types/crud.types.js";
import {
  Category,
  CategoryCore,
  CategoryRelations,
} from "types/controller.types.js";
import { v4 as uuidv4 } from "uuid";
import { CategoryCreateDto, CategoryUpdateDto, CategoryConnect } from "types/dto.types.js";
import { ReadAllParams } from "types/db.types.js";
import { Prisma } from "@prisma/client";

export function normalizeCategory(cat: any): Category {
  return {
    category_id: cat.category_id,
    str_value: cat.str_value,
    type: cat.type,
    publications_type: cat.publications_type ?? null,
    publications_style: cat.publications_style ?? null,
    publications_author: cat.publications_author ?? null,
    prep_time: cat.prep_time ?? null,
    publication_tags: cat.publication_tags ?? null,
    product_categories: cat.product_categories ?? null,
  };
}

export class CategoryController
  implements GenericController<Category, CategoryCore, CategoryRelations, CategoryConnect, CategoryConnect>
{
  async create(
    payload: CategoryCore & {
      connect?: CategoryCreateDto["connect"];
    },
  ): Promise<Category> {
    const newId = payload.category_id ?? uuidv4();
    
    const category = await prisma.category.create({
      data: {
        category_id: newId,
        str_value: payload.str_value,
        type: payload.type,

        // Relations 1-N (peuvent être connectées à la création)
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

        // Relations N-N
        publication_tags: payload.connect?.publication_tags
          ? {
              create: payload.connect.publication_tags.map((pt) => ({
                  category_id: newId,
                  publication_id: pt.publication_id,
              })),
            }
          : undefined,

        product_categories: payload.connect?.product_categories
          ? {
              create: payload.connect.product_categories.map((pc) => ({
                product_id: pc.product_id,
                category_id: newId,
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
      include: {
        publications_type: true,
        publications_style: true,
        publications_author: true,
        prep_time: true,
        publication_tags: true,
        product_categories: true,
      }
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
      // Les relations sont coûteuses, on ne les inclut pas par défaut
    });

    return categories.map(normalizeCategory);
  }

  async update(id: string, payload: CategoryUpdateDto): Promise<Category> {
    const data: Prisma.categoryUpdateInput = {};

    if (payload.str_value !== undefined) data.str_value = payload.str_value;
    if (payload.type !== undefined) data.type = payload.type;
    
    // Helper pour créer les connexions N-N
    const mapNNConnect = (connects: any[], idKey: string, otherKey: string) => 
      connects.map((c) => ({
          [idKey]: id, // category_id ou prep_time_id
          [otherKey]: c[otherKey], // publication_id, product_id, prep_time_id
      }));

    const category = await prisma.category.update({
      where: { category_id: id },
      data: {
        ...data,
        // Relations 1-N (mise à jour de la FK inverse)
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
        
        // Relations N-N (PublicationTags)
        publication_tags: payload.connect?.publication_tags
          ? { connect: payload.connect.publication_tags.map(pt => ({ 
              publication_id_category_id: { publication_id: pt.publication_id, category_id: id }
            })) }
          : payload.set?.publication_tags
            ? { set: payload.set.publication_tags.map(pt => ({ 
              publication_id_category_id: { publication_id: pt.publication_id, category_id: id }
            })) }
            : undefined,
            
        // Relations N-N (ProductCategories)
        product_categories: payload.connect?.product_categories
          ? { connect: payload.connect.product_categories.map(pc => ({ 
              product_id_category_id: { product_id: pc.product_id, category_id: id }
            })) }
          : payload.set?.product_categories
            ? { set: payload.set.product_categories.map(pc => ({ 
              product_id_category_id: { product_id: pc.product_id, category_id: id }
            })) }
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
