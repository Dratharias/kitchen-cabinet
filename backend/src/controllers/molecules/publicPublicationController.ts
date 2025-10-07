import { prisma } from "../../config.js";
import {
  shapePublicPublicationFull,
  shapePublicPublicationSummary,
} from "../../utils/shapePublication.js";
import type {
  Publication,
  PublicationCore,
  PublicationRelations,
} from "types/controller.types";
import type { GenericPaginatedController } from "types/crud.types";
import type { PublicationReadAllDto, PublicationConnect } from "types/dto.types";

export class PublicPublicationController
  implements
    GenericPaginatedController<
      Publication,
      PublicationCore,
      PublicationRelations,
      PublicationConnect
    >
{
  // =====================================================
  // READ — Tous publics
  // =====================================================
  async findAll(
    params?: PublicationReadAllDto,
  ): Promise<{
    items: Publication[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const where: any = { public: true, published: true };

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

    return {
      items: pubs.map((p) => shapePublicPublicationSummary(p)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // =====================================================
  // READ — Par ID
  // =====================================================
  async findById(id: string): Promise<Publication | null> {
    const pub = await prisma.publication.findFirst({
      where: { publication_id: id, public: true, published: true },
      include: this.buildFullInclude(),
    });
    return pub ? shapePublicPublicationFull(pub) : null;
  }

  // =====================================================
  // STUB — Non supporté publiquement
  // =====================================================
  async create(): Promise<any> {
    throw new Error("PublicPublicationController.create() not allowed.");
  }

  async update(): Promise<any> {
    throw new Error("PublicPublicationController.update() not allowed.");
  }

  async delete(): Promise<{ deleted: boolean }> {
    throw new Error("PublicPublicationController.delete() not allowed.");
  }

  // =====================================================
  // Prisma Includes
  // =====================================================
  private buildSummaryInclude() {
    return {
      type: true,
      style: true,
      author: true,
      tags: {
        include: {
          category: {
            select: { category_id: true, str_value: true, type: true },
          },
        },
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
        include: {
          category: {
            select: { category_id: true, str_value: true, type: true },
          },
        },
      },
      contents: {
        include: {
          content_segments: {
            include: {
              segment: {
                select: {
                  segment_id: true,
                  title: true,
                  paragraph: true,
                },
              },
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
                    include: {
                      unit: { select: { unit_id: true, name: true } },
                    },
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
                  style: {
                    select: { category_id: true, str_value: true },
                  },
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
