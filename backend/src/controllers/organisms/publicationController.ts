import { Prisma } from "@prisma/client";
import { prisma } from "../../config.js";
import { v4 as uuidv4 } from "uuid";
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
  PublicationUpdateDto,
} from "types/dto.types";

export class PublicationController
  implements
    GenericPaginatedController<
      Publication,
      PublicationCore,
      PublicationRelations,
      PublicationConnect
    >
{
  // =====================================================
  // CREATE
  // =====================================================
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

  // =====================================================
  // READ BY ID
  // =====================================================
  async findById(id: string): Promise<Publication | null> {
    const pub = await prisma.publication.findFirst({
      where: { publication_id: id },
      include: this.buildFullInclude(),
    });
    return pub ? shapePublicPublicationFull(pub) : null;
  }

  // =====================================================
  // READ ALL — admin/public + recherche + tolérance orthographique
  // (Logique inchangée, utilise les optimisations existantes)
  // =====================================================
  async findAll(params?: PublicationReadAllDto & { admin?: boolean }): Promise<{
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

    // --- Normalisation des filtres ---
    const filter = params?.filter ?? {};
    const q = typeof filter.q === "string" ? filter.q.trim() : null;
    const typeField = (filter as any).type;
    const types: string[] = Array.isArray(typeField)
      ? typeField
      : typeField
        ? [typeField]
        : [];

    // --- Filtre de base (public/published si non admin) ---
    const where: Prisma.publicationWhereInput = {
      AND: [
        !params?.admin ? { public: true, published: true } : undefined,
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

    // --- Comptage total ---
    const total = await prisma.publication.count({ where });

    // --- Fetch principal ---
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

    const items = results.map((p) => shapePublicPublicationSummary(p));
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  // =====================================================
  // UPDATE (supporte PUT et PATCH)
  // =====================================================
  async update(
    id: string,
    payload: PublicationUpdateDto,
  ): Promise<Publication> {
    
    // Construction de l'objet de données pour Prisma (uniquement les champs fournis dans le payload)
    const data: Prisma.publicationUpdateInput = {};

    // Champs scalaires (mise à jour atomique)
    if (payload.title !== undefined) data.title = payload.title;
    if (payload.description !== undefined) data.description = payload.description;
    if (payload.note !== undefined) data.note = payload.note;
    if (payload.public !== undefined) data.public = payload.public;
    if (payload.published !== undefined) data.published = payload.published;
    if (payload.thumbnail !== undefined) data.thumbnail = payload.thumbnail;
    if (payload.gallery !== undefined) data.gallery = payload.gallery;

    // Relations (connect/set pour les FK et N-N)
    // Relations 1-N (Category/FK): on utilise le connect DTO
    if (payload.connect?.type?.[0]) data.type = { connect: payload.connect.type[0] };
    if (payload.connect?.style?.[0]) data.style = { connect: payload.connect.style[0] };
    if (payload.connect?.author?.[0]) data.author = { connect: payload.connect.author[0] };

    // Relations N-N (Tags)
    if (payload.connect?.tags) data.tags = { connect: payload.connect.tags };
    if (payload.set?.tags) data.tags = { set: payload.set.tags };


    const pub = await prisma.publication.update({
      where: { publication_id: id },
      data: data, // Passe l'objet de données construit
      include: this.buildFullInclude(),
    });
    return shapePublicPublicationFull(pub);
  }

  // =====================================================
  // DELETE
  // =====================================================
  async delete(id: string): Promise<{ deleted: boolean }> {
    await prisma.publication.delete({ where: { publication_id: id } });
    return { deleted: true };
  }

  // =====================================================
  // INCLUDES (inchangés)
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
                select: { segment_id: true, title: true, paragraph: true },
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
