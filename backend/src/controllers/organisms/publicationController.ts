import {
  shapePublicPublicationFull,
  shapePublicPublicationSummary,
} from "../../utils/shapePublication.js";
import { prisma } from "../../config.js";
import { v4 as uuidv4 } from "uuid";
import type {
  Publication,
  PublicationCore,
  PublicationRelations,
} from "types/controller.types";
import type { GenericPaginatedController } from "types/crud.types";
import type { PublicationReadAllDto, PublicationConnect } from "types/dto.types";

export class PublicationController
  implements
    GenericPaginatedController<
      Publication,
      PublicationCore,
      PublicationRelations,
      PublicationConnect
    >
{
  async create(payload: PublicationCore): Promise<Publication> {
    const newId = payload.publication_id ?? uuidv4();
    const pub = await prisma.publication.create({
      data: {
        publication_id: newId,
        title: payload.title,
        description: payload.description ?? [],
        note: payload.note ?? [],
        public: payload.public ?? true,
        published: payload.published ?? true,
        thumbnail: payload.thumbnail ?? null,
        gallery: payload.gallery ?? [],
      },
      include: this.buildFullInclude(),
    });
    return shapePublicPublicationFull(pub);
  }

  async findById(id: string): Promise<Publication | null> {
    const pub = await prisma.publication.findFirst({
      where: { publication_id: id },
      include: this.buildFullInclude(),
    });
    return pub ? shapePublicPublicationFull(pub) : null;
  }

  async findAll(
    params?: PublicationReadAllDto & { admin?: boolean },
  ): Promise<{
    items: Publication[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const where: any = {};
    if (!params?.admin) {
      where.public = true;
      where.published = true;
    }

    const limit = Number(params?.limit ?? 12);
    const page = Number(params?.page ?? 1);
    const skip = Number(params?.skip ?? (page - 1) * limit);

    const total = await prisma.publication.count({ where });
    const pubs = await prisma.publication.findMany({
      where,
      include: this.buildSummaryInclude(),
      skip,
      take: limit,
    });

    const items = pubs.map((p) => shapePublicPublicationSummary(p));
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async update(
    id: string,
    payload: Partial<PublicationCore & PublicationRelations>,
  ): Promise<Publication> {
    const pub = await prisma.publication.update({
      where: { publication_id: id },
      data: {
        title: payload.title,
        description: payload.description ?? [],
        note: payload.note ?? [],
        public: payload.public ?? true,
        published: payload.published ?? true,
        thumbnail: payload.thumbnail ?? null,
        gallery: payload.gallery ?? [],
      },
      include: this.buildFullInclude(),
    });
    return shapePublicPublicationFull(pub);
  }

  async delete(id: string): Promise<{ deleted: boolean }> {
    await prisma.publication.delete({ where: { publication_id: id } });
    return { deleted: true };
  }

  private buildSummaryInclude() {
    return {
      type: true,
      style: true,
      author: true,
      tags: {
        include: { category: { select: { category_id: true, str_value: true, type: true } } },
      },
      contents: {
        select: {
          content_id: true,
          total_prep_time: true,
          servings: true,
          subtitle: true,
          is_ingredient: true,
        },
      },
      reviews: { select: { rating: true } },
    };
  }

  private buildFullInclude() {
    return {
      type: true,
      style: true,
      author: true,
      tags: {
        include: { category: { select: { category_id: true, str_value: true, type: true } } },
      },
      contents: {
        include: {
          content_segments: {
            include: {
              segment: { select: { segment_id: true, title: true, paragraph: true } },
            },
          },
          content_ingredients: {
            include: {
              ingredient: {
                select: {
                  ingredient_id: true,
                  quantity: true,
                  multiply_factor: true,
                  cut: true,
                  title: true,
                  product: {
                    select: {
                      product_id: true,
                      name: true,
                      en_name: true,
                      macro: { select: { calories: true, protein: true } },
                    },
                  },
                  ingredient_units: {
                    include: { unit: { select: { unit_id: true, name: true } } },
                  },
                },
              },
            },
          },
          content_prep_times: {
            include: {
              prep_time: {
                select: {
                  prep_time_id: true,
                  duration: true,
                  style: { select: { category_id: true, str_value: true } },
                },
              },
            },
          },
        },
      },
      reviews: { select: { rating: true, comment: true } },
    };
  }
}
