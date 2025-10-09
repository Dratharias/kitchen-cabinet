import { Prisma } from "@prisma/client";
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
import type {
  PublicationReadAllDto,
  PublicationConnect,
} from "types/dto.types";

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
  // READ — Tous publics (avec recherche et tolérance)
  // =====================================================
  async findAll(params?: PublicationReadAllDto): Promise<{
    items: Publication[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const limit = Number(params?.limit) || 12;
    const page = Number(params?.page) || 1;
    const skip = (page - 1) * limit;
    const sortBy = params?.sortBy || "title";
    const order = params?.order === "desc" ? "desc" : "asc";

    // --- Normalisation du filtre ---
    const filter = params?.filter ?? {};
    const q = typeof filter.q === "string" ? filter.q.trim() : null;
    const typeField = (filter as any).type;
    const types: string[] = Array.isArray(typeField)
      ? typeField
      : typeField
        ? [typeField]
        : [];

    // --- Filtre principal ---
    const where: Prisma.publicationWhereInput = {
      public: true,
      published: true,
      AND: [
        types.length ? { type: { str_value: { in: types } } } : undefined,
        q
          ? {
              OR: [
                { title: { contains: q, mode: Prisma.QueryMode.insensitive } },
                { description: { hasSome: [q] } },
                {
                  contents: {
                    some: {
                      OR: [
                        {
                          content_segments: {
                            some: {
                              segment: {
                                paragraph: {
                                  contains: q,
                                  mode: Prisma.QueryMode.insensitive,
                                },
                              },
                            },
                          },
                        },
                        {
                          content_ingredients: {
                            some: {
                              ingredient: {
                                OR: [
                                  {
                                    title: {
                                      contains: q,
                                      mode: Prisma.QueryMode.insensitive,
                                    },
                                  },
                                  {
                                    cut: {
                                      contains: q,
                                      mode: Prisma.QueryMode.insensitive,
                                    },
                                  },
                                  {
                                    product: {
                                      name: {
                                        contains: q,
                                        mode: Prisma.QueryMode.insensitive,
                                      },
                                    },
                                  },
                                  {
                                    ingredient_units: {
                                      some: {
                                        unit: {
                                          name: {
                                            contains: q,
                                            mode: Prisma.QueryMode.insensitive,
                                          },
                                        },
                                      },
                                    },
                                  },
                                ],
                              },
                            },
                          },
                        },
                      ],
                    },
                  },
                },
              ],
            }
          : undefined,
      ].filter(Boolean) as Prisma.publicationWhereInput[],
    };

    // --- Pagination & comptage ---
    const total = await prisma.publication.count({ where });

    // --- Requête principale ---
    const pubs = await prisma.publication.findMany({
      where,
      include: this.buildSummaryInclude(),
      skip,
      take: limit,
      orderBy: { [sortBy]: order },
    });

    // --- Tolérance orthographique (pg_trgm) ---
    let results = pubs;
    if (q) {
      const safeQ = q.replace(/'/g, "''");
      const fuzzy = await prisma.$queryRawUnsafe<{ publication_id: string }[]>(`
        SELECT publication_id
        FROM publication
        WHERE similarity(unaccent(lower(title)), unaccent(lower('${safeQ}'))) > 0.4
        ORDER BY similarity(unaccent(lower(title)), unaccent(lower('${safeQ}'))) DESC
        LIMIT 50;
      `);
      const fuzzyIds = fuzzy.map((f) => f.publication_id);
      if (fuzzyIds.length > 0) {
        const fuzzyItems = await prisma.publication.findMany({
          where: { publication_id: { in: fuzzyIds } },
          include: this.buildSummaryInclude(),
        });
        const merged = new Map<string, any>();
        [...pubs, ...fuzzyItems].forEach((p) =>
          merged.set(p.publication_id, p),
        );
        results = Array.from(merged.values()).sort((a, b) =>
          a.title.localeCompare(b.title, "fr", { sensitivity: "base" }),
        );
      }
    }

    return {
      items: results.map((p) => shapePublicPublicationSummary(p)),
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
