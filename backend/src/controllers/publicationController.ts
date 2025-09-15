import { FastifyInstance } from "fastify";
import { PrismaClient } from "@prisma/client";
import { validate as isUUID } from "uuid";
import { CRUDController } from "./crudController.js";
import {
  PublicationDetails,
  PublicationBody,
  ContentInput,
  ReviewInput,
} from "../types/publication.js";

const prisma = new PrismaClient();

/**
 * Map prisma model -> API details
 * Note : reviews list is intentionally not included for readOne to avoid heavy payloads.
 */
function mapPublication(pub: any, includeReviews = true): PublicationDetails {
  return {
    publicationId: pub.publication_id,
    title: pub.title,
    description: pub.description,
    note: pub.note,
    public: pub.public,
    published: pub.published,
    thumbnail: pub.thumbnail ?? undefined,
    type: pub.type && {
      categoryId: pub.type.category_id,
      strValue: pub.type.str_value,
      type: pub.type.type,
    },
    style: pub.style && {
      categoryId: pub.style.category_id,
      strValue: pub.style.str_value,
      type: pub.style.type,
    },
    author: pub.author && {
      categoryId: pub.author.category_id,
      strValue: pub.author.str_value,
      type: pub.author.type,
    },
    tags: (pub.tags ?? []).map((t: any) => ({
      categoryId: t.category?.category_id || t.category_id,
      strValue: t.category?.str_value || t.str_value,
      type: t.category?.type || t.type,
    })),
    contents: (pub.contents ?? []).map((c: any) => ({
      contentId: c.content_id,
      servings: c.servings ?? undefined,
      totalPrepTime: c.total_prep_time,
      prepTimes: (c.content_prep_times ?? []).map((pt: any) => ({
        prepTimeId: pt.prep_time.prep_time_id,
        duration: pt.prep_time.duration,
        category: pt.prep_time.style && {
          categoryId: pt.prep_time.style.category_id,
          strValue: pt.prep_time.style.str_value,
          type: pt.prep_time.style.type,
        },
      })),
      ingredients: (c.content_ingredients ?? []).map((ci: any) => ({
        ingredientId: ci.ingredient.ingredient_id,
        quantity: ci.ingredient.quantity,
        units: ci.ingredient.ingredient_units?.map((u: any) => ({ name: u.unit.name })),
        multiplyFactor: ci.ingredient.multiply_factor,
        product: {
          productId: ci.ingredient.product.product_id,
          name: ci.ingredient.product.name,
        },
      })),
      segments: (c.content_segments ?? [])
        .sort((a: any, b: any) => (a.position ?? 0) - (b.position ?? 0))
        .map((seg: any) => ({
          segmentId: seg.segment.segment_id,
          title: seg.segment.title ?? undefined,
          paragraph: seg.segment.paragraph,
          order: seg.segment.order_num ?? 0,
          prepTimes: (seg.segment.segment_prep_time ?? []).map((spt: any) => ({
            prepTimeId: spt.prep_time.prep_time_id,
            duration: spt.prep_time.duration,
            category: spt.prep_time.style && {
              categoryId: spt.prep_time.style.category_id,
              strValue: spt.prep_time.style.str_value,
              type: spt.prep_time.style.type,
            },
          })),
        })),
    })),
    reviews: includeReviews
      ? (pub.reviews ?? []).map((r: any) => ({
          reviewId: r.review_id,
          productId: r.product_id ?? undefined,
          rating: r.rating ?? undefined,
          comment: r.comment ?? [],
          description: r.description ?? [],
          buyAgain: r.buy_again ?? undefined,
          dateReview: r.date_review ?? null,
        }))
      : undefined,
  };
}

// Build nested data for prisma create/update (accept Partial for updates)
function buildCreateData(body: PublicationBody) {
  return {
    title: body.title,
    description: body.description ?? [],
    note: body.note ?? [],
    public: body.public ?? false,
    published: body.published ?? false,
    ...(body.thumbnail && { thumbnail: body.thumbnail }),
    ...(body.type_id && { type_id: body.type_id }),
    ...(body.style_id && { style_id: body.style_id }),
    ...(body.author_id && { author_id: body.author_id }),
    ...(body.contents?.length && {
      contents: {
        create: body.contents.map((c: ContentInput) => ({
          servings: c.servings,
          total_prep_time: c.totalPrepTime ?? 0,
          ...(c.contentPrepTimes?.length && {
            content_prep_times: {
              create: c.contentPrepTimes.map(pt => ({
                prep_time: {
                  create: {
                    duration: pt.duration,
                    style_id: pt.categoryId,
                  },
                },
              })),
            },
          }),
          ...(c.contentIngredients?.length && {
            content_ingredients: { 
              create: c.contentIngredients.map(i => ({ ingredient_id: i.ingredientId })) 
            }
          }),
        }))
      }
    }),
    ...(body.reviews?.length && {
      reviews: { 
        create: body.reviews.map((r: ReviewInput) => ({ 
          rating: r.rating, 
          comment: r.comment ? [r.comment] : [] 
        })) 
      }
    }),
  };
}

function buildUpdateData(body: Partial<PublicationBody>) {
  const data: any = {};
  
  if (body.title !== undefined) data.title = body.title;
  if (body.description !== undefined) data.description = body.description;
  if (body.note !== undefined) data.note = body.note;
  if (body.public !== undefined) data.public = body.public;
  if (body.published !== undefined) data.published = body.published;
  if (body.thumbnail !== undefined) data.thumbnail = body.thumbnail;
  if (body.type_id !== undefined) data.type_id = body.type_id;
  if (body.style_id !== undefined) data.style_id = body.style_id;
  if (body.author_id !== undefined) data.author_id = body.author_id;
  
  return data;
}

async function savePublication(id: string | null, body: Partial<PublicationBody>) {
  const include = {
    type: true,
    style: true,
    author: true,
    tags: true,
    contents: {
      include: {
        content_segments: { include: { segment: { include: { segment_prep_time: { include: { prep_time: { include: { style: true } } } } } } } },
        content_prep_times: { include: { prep_time: { include: { style: true } } } },
        content_ingredients: {
          include: { ingredient: { include: { product: true, ingredient_units: { include: { unit: true } } } } },
        },
      },
    },
  };

  if (id) {
    const data = buildUpdateData(body);
    return prisma.publication.update({
      where: { publication_id: id },
      data,
      include,
    });
  } else {
    const data = buildCreateData(body as PublicationBody);
    return prisma.publication.create({
      data,
      include,
    });
  }
}

// ----------------- Controller -----------------

const publicationController: CRUDController<PublicationBody, { id: string }, { page?: string; limit?: string }> = {
  // Create
  create: async (req, reply) => {
    try {
      const pub = await savePublication(null, req.body);
      const mapped = mapPublication(pub);
      reply.code(201).send(mapped);
    } catch (err: any) {
      reply.code(500).send({ error: err.message });
    }
  },

  // Read all publications (supports pagination) and returns reviewsCount + averageRating per publication (bulk)
  readAll: async (req, reply) => {
    try {
      const page = Math.max(1, parseInt(String((req.query as any)?.page ?? "1"), 10) || 1);
      const limit = Math.min(200, Math.max(1, parseInt(String((req.query as any)?.limit ?? "50"), 10) || 50));
      const skip = (page - 1) * limit;

      // Extract type filters
      const queryTypes = (req.query as any)?.type;
      const typeFilters = Array.isArray(queryTypes) ? queryTypes : queryTypes ? [queryTypes] : [];

      // Build where clause with type filtering
      const whereClause: any = {};
      if (typeFilters.length > 0) {
        whereClause.AND = [
          { type: { isNot: null } },
          { type: { str_value: { in: typeFilters } } }
        ];
      }

      // fetch publications page with type filtering
      const pubs = await prisma.publication.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: { title: "asc" },
        include: {
          type: true,
          style: true,
          author: true,
          tags: { include: { category: true } }
        },
      });

      const pubIds = pubs.map((p) => p.publication_id);
      const groups = pubIds.length
        ? await prisma.review.groupBy({
            by: ["publication_id"],
            where: { publication_id: { in: pubIds } },
            _count: { _all: true },
            _avg: { rating: true },
          })
        : [];

      const statsByPub: Record<string, { count: number; average: number | null }> = {};
      for (const g of groups) {
        if (!g.publication_id) continue;
        statsByPub[g.publication_id] = {
          count: g._count?._all ?? 0,
          average: g._avg?.rating ?? null,
        };
      }

      const mapped = pubs.map((p) => {
        const base = mapPublication(p, false);
        return {
          ...base,
          reviewsCount: statsByPub[p.publication_id]?.count ?? 0,
          averageRating: statsByPub[p.publication_id]?.average ?? null,
        };
      });

      // total count with same filtering for accurate pagination
      const total = await prisma.publication.count({ where: whereClause });

      reply.send({
        data: mapped,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (err: any) {
      reply.code(500).send({ error: err.message });
    }
  },

  // Read one publication (metadata) + reviews summary (count & averageRating)
  readOne: async (req, reply) => {
    const { id } = req.params;
    if (!isUUID(id)) return reply.code(400).send({ error: "Invalid UUID" });

    try {
      const pub = await prisma.publication.findUnique({
        where: { publication_id: id },
        include: {
          type: true,
          style: true,
          author: true,
          tags: { include: { category: true } },
          contents: {
            include: {
              content_segments: { include: { segment: { include: { segment_prep_time: { include: { prep_time: { include: { style: true } } } } } } } },
              content_prep_times: { include: { prep_time: { include: { style: true } } } },
              content_ingredients: {
                include: { ingredient: { include: { product: true, ingredient_units: { include: { unit: true } } } } },
              },
            },
          },
        },
      });

      if (!pub) return reply.code(404).send({ error: "Not found" });

      // Aggregate reviews: count and average rating (only numeric rating)
      const agg = await prisma.review.aggregate({
        where: { publication_id: id },
        _count: { _all: true },
        _avg: { rating: true },
      });

      const mapped = mapPublication(pub, false);

      // Attach lightweight review summary fields (no list)
      const response = {
        ...mapped,
        reviewsCount: agg._count?._all ?? 0,
        averageRating: agg._avg?.rating ?? null,
      };

      reply.send(response);
    } catch (err: any) {
      reply.code(500).send({ error: err.message });
    }
  },

  // Update publication
  update: async (req, reply) => {
    const { id } = req.params;
    if (!isUUID(id)) return reply.code(400).send({ error: "Invalid UUID" });

    try {
      const pub = await savePublication(id, req.body);

      // recompute aggregate after update
      const agg = await prisma.review.aggregate({
        where: { publication_id: id },
        _count: { _all: true },
        _avg: { rating: true },
      });

      const mapped = mapPublication(pub);
      reply.send({
        ...mapped,
        reviewsCount: agg._count?._all ?? 0,
        averageRating: agg._avg?.rating ?? null,
      });
    } catch (err: any) {
      reply.code(500).send({ error: err.message });
    }
  },

  // Delete publication
  delete: async (req, reply) => {
    const { id } = req.params;
    if (!isUUID(id)) return reply.code(400).send({ error: "Invalid UUID" });

    try {
      await prisma.publication.delete({ where: { publication_id: id } });
      reply.send({ success: true });
    } catch (err: any) {
      reply.code(500).send({ error: err.message });
    }
  },

  // Advanced routes
  advancedRoutes: (basePath: string, fastify: FastifyInstance) => {
    // GET /api/publications/:id/reviews?page=&limit=
    fastify.get<{ Params: { id: string }; Querystring: { page?: string; limit?: string } }>(
      `${basePath}/:id/reviews`,
      async (req, reply) => {
        const { id } = req.params;
        if (!isUUID(id)) return reply.code(400).send({ error: "Invalid UUID" });

        // parse pagination
        const page = Math.max(1, parseInt(String(req.query?.page ?? "1"), 10) || 1);
        const limit = Math.min(200, Math.max(1, parseInt(String(req.query?.limit ?? "20"), 10) || 20));
        const skip = (page - 1) * limit;

        try {
          // publication meta
          const publicationMeta = await prisma.publication.findUnique({
            where: { publication_id: id },
            select: { publication_id: true, title: true, thumbnail: true },
          });
          if (!publicationMeta) return reply.code(404).send({ error: "Publication not found" });

          // aggregate count + average for this publication
          const agg = await prisma.review.aggregate({
            where: { publication_id: id },
            _count: { _all: true },
            _avg: { rating: true },
          });

          // fetch paged reviews for this publication
          const reviews = await prisma.review.findMany({
            where: { publication_id: id },
            include: {
              product: { select: { product_id: true, name: true } },
              publication: { select: { publication_id: true, title: true } }, // if review also links to a publication
            },
            orderBy: { date_review: "desc" },
            skip,
            take: limit,
          });

          // map reviews to include reviewedEntity (product or publication) and other fields
          const mappedReviews = reviews.map((r) => {
            const reviewedEntity =
              r.product
                ? { type: "product", id: r.product.product_id, title: r.product.name }
                : r.publication
                ? { type: "publication", id: r.publication.publication_id, title: r.publication.title }
                : null;

            return {
              reviewId: r.review_id,
              rating: r.rating ?? null,
              comment: r.comment ?? [],
              description: r.description ?? [],
              buyAgain: r.buy_again ?? null,
              dateReview: r.date_review,
              reviewedEntity,
            };
          });

          // total reviews count for pagination meta (we already have agg._count)
          const total = agg._count?._all ?? 0;

          return reply.send({
            publication: publicationMeta,
            count: total,
            averageRating: agg._avg?.rating ?? null,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
            reviews: mappedReviews,
          });
        } catch (err: any) {
          req.log?.error?.(err);
          return reply.code(500).send({ error: err.message ?? "Internal error" });
        }
      }
    );
  },
};

export default publicationController;