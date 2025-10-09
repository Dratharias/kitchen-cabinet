import { Prisma } from "@prisma/client";
import { prisma } from "config";

interface FetchOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  order?: "asc" | "desc";
  filter?: Record<string, any>;
  isPublic?: boolean;
}

/**
 * Logique unifiée pour recherche, tri, pagination et tolérance orthographique.
 */
export async function fetchPublicationsUnified({
  page = 1,
  limit = 12,
  sortBy = "title",
  order = "asc",
  filter = {},
  isPublic = false,
}: FetchOptions) {
  const offset = (page - 1) * limit;
  const q = typeof filter.q === "string" ? filter.q.trim() : null;
  const types = Array.isArray(filter.type) ? filter.type : [];

  const insensitive = Prisma.QueryMode.insensitive;

  // --- Construction du filtre WHERE ---
  const where: Prisma.publicationWhereInput = {
    AND: [
      types.length ? { type: { str_value: { in: types } } } : undefined,
      isPublic ? { public: true, published: true } : undefined,
      q
        ? {
            OR: [
              { title: { contains: q, mode: insensitive } },
              { description: { hasSome: [q] } },
              {
                contents: {
                  some: {
                    OR: [
                      // Recherche dans les paragraphes
                      {
                        content_segments: {
                          some: {
                            segment: {
                              paragraph: { contains: q, mode: insensitive },
                            },
                          },
                        },
                      },
                      // Recherche dans les ingrédients et produits liés
                      {
                        content_ingredients: {
                          some: {
                            ingredient: {
                              OR: [
                                { title: { contains: q, mode: insensitive } },
                                { cut: { contains: q, mode: insensitive } },
                                {
                                  product: {
                                    name: { contains: q, mode: insensitive },
                                  },
                                },
                                {
                                  ingredient_units: {
                                    some: {
                                      unit: {
                                        name: {
                                          contains: q,
                                          mode: insensitive,
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

  const orderBy: Prisma.publicationOrderByWithRelationInput = {
    [sortBy]: order === "desc" ? "desc" : "asc",
  };

  // --- Requête principale ---
  const [items, total] = await Promise.all([
    prisma.publication.findMany({
      where,
      orderBy,
      skip: offset,
      take: limit,
      include: {
        contents: {
          include: {
            content_segments: {
              include: { segment: true },
            },
            content_ingredients: {
              include: {
                ingredient: {
                  include: {
                    product: true,
                    ingredient_units: {
                      include: { unit: true },
                    },
                  },
                },
              },
            },
          },
        },
        type: true,
        style: true,
        author: true,
        tags: {
          include: { category: true },
        },
      },
    }),
    prisma.publication.count({ where }),
  ]);

  // --- Tolérance orthographique (pg_trgm) ---
  if (q) {
    const safeQ = q.replace(/'/g, "''");
    const fuzzyMatches = await prisma.$queryRawUnsafe<
      { publication_id: string }[]
    >(`
      SELECT publication_id
      FROM publication
      WHERE similarity(unaccent(lower(title)), unaccent(lower('${safeQ}'))) > 0.4
      ORDER BY similarity(unaccent(lower(title)), unaccent(lower('${safeQ}'))) DESC
      LIMIT 50;
    `);

    const fuzzyIds = fuzzyMatches.map((r) => r.publication_id);
    if (fuzzyIds.length > 0) {
      const fuzzyItems = await prisma.publication.findMany({
        where: { publication_id: { in: fuzzyIds } },
        include: { type: true, style: true, author: true, tags: true },
      });

      const merged = new Map<string, any>();
      [...items, ...fuzzyItems].forEach((i) => merged.set(i.publication_id, i));

      return {
        items: Array.from(merged.values()).sort((a, b) =>
          a.title.localeCompare(b.title, "fr", { sensitivity: "base" }),
        ),
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    }
  }

  // --- Résultat final ---
  return {
    items: items.sort((a, b) =>
      a.title.localeCompare(b.title, "fr", { sensitivity: "base" }),
    ),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}
