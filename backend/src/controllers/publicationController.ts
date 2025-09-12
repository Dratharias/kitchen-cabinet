import { FastifyRequest, FastifyReply, FastifyInstance } from "fastify";
import { PrismaClient } from "@prisma/client";
import { validate as isUUID } from "uuid";
import { CRUDController } from "./crudController.js";
import {
  PublicationDetails,
  PublicationListItem,
  ContentDetails,
  SegmentDetails,
  ContentPrepTime,
  PublicationReview,
} from "../types/publication.js";

const prisma = new PrismaClient();

interface ParamsWithId {
  id: string;
}

interface PublicationQuery {
  page?: string;
  limit?: string;
  type?: string | string[];
}

interface PublicationBody {
  title: string;
  description?: string[];
  note?: string[];
  public?: boolean;
  published?: boolean;
  thumbnail?: string;
  type_id?: string;
  style_id?: string;
  author_id?: string;
}

function getPagination(query: PublicationQuery): { page: number; limit: number; skip: number } {
  const page = parseInt(query.page ?? "1", 10);
  const limit = parseInt(query.limit ?? "10", 10);
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

const mapPrepTime = (prep: any): ContentPrepTime => ({
  prepTimeId: prep.prep_time_id,
  duration: prep.duration,
  category: prep.prep_time_categories?.[0]?.category && {
    categoryId: prep.prep_time_categories[0].category.category_id,
    strValue: prep.prep_time_categories[0].category.str_value,
    type: prep.prep_time_categories[0].category.type,
  },
});

const mapSegment = (seg: any): SegmentDetails => ({
  segmentId: seg.segment_id,
  title: seg.title ?? undefined,
  paragraph: seg.paragraph,
  order: seg.order_num ?? 0,
  prepTimes: (seg.segment_prep_time ?? []).map((spt: any) => mapPrepTime(spt.prep_time)),
});

const mapContent = (content: any, includeIngredients = true): ContentDetails => ({
  contentId: content.content_id,
  totalPrepTime: content.total_prep_time,
  servings: content.servings ?? undefined,
  prepTimes: (content.content_prep_times ?? []).map((cpt: any) => mapPrepTime(cpt.prep_time)),
  segments: (content.content_segments ?? [])
    .sort((a: any, b: any) => (a.position ?? 0) - (b.position ?? 0))
    .map((cs: any) => mapSegment(cs.segment)),
  ingredients: includeIngredients
    ? (content.content_ingredients ?? []).map((ci: any) => ({
        ingredientId: ci.ingredient.ingredient_id,
        quantity: ci.ingredient.quantity,
        units: ci.ingredient.ingredient_units?.map((u: any) => ({ name: u.unit.name })),
        product: {
          productId: ci.ingredient.product.product_id,
          name: ci.ingredient.product.name,
        },
      }))
    : [],
});

const mapReview = (r: any): PublicationReview => ({
  reviewId: r.review_id,
  productId: r.product_id ?? undefined,
  rating: r.rating ?? undefined,
  comment: r.comment ?? [],
  description: r.description ?? [],
  buyAgain: r.buy_again ?? undefined,
  dateReview: r.date_review ?? null,
});

const mapPublicationDetails = (pub: any): PublicationDetails => ({
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
    type: pub.type.type 
  },
  style: pub.style && { 
    categoryId: pub.style.category_id, 
    strValue: pub.style.str_value, 
    type: pub.style.type 
  },
  author: pub.author && { 
    categoryId: pub.author.category_id, 
    strValue: pub.author.str_value, 
    type: pub.author.type 
  },
  reviews: (pub.reviews ?? []).map(mapReview),
  contents: (pub.contents ?? []).map((c: any) => mapContent(c, true)),
});

const mapPublicationListItem = (pub: any): PublicationListItem => ({
  publicationId: pub.publication_id,
  title: pub.title,
  description: pub.description,
  note: pub.note,
  thumbnail: pub.thumbnail ?? undefined,
  type: pub.type && { 
    categoryId: pub.type.category_id, 
    strValue: pub.type.str_value, 
    type: pub.type.type 
  },
  style: pub.style && { 
    categoryId: pub.style.category_id, 
    strValue: pub.style.str_value, 
    type: pub.style.type 
  },
  author: pub.author && { 
    categoryId: pub.author.category_id, 
    strValue: pub.author.str_value, 
    type: pub.author.type 
  },
});

const publicationController: CRUDController<PublicationBody, ParamsWithId, PublicationQuery> = {
  create: async (req: FastifyRequest<{ Body: PublicationBody }>, reply: FastifyReply) => {
    try {
      const publication = await prisma.publication.create({ 
        data: req.body,
        include: {
          type: true,
          style: true,
          author: true,
          reviews: true,
          contents: {
            include: {
              content_segments: {
                include: { 
                  segment: { 
                    include: { 
                      segment_prep_time: { 
                        include: { 
                          prep_time: { 
                            include: { 
                              prep_time_categories: { include: { category: true } } 
                            } 
                          } 
                        } 
                      } 
                    } 
                  } 
                },
              },
              content_prep_times: { include: { prep_time: { include: { prep_time_categories: { include: { category: true } } } } } },
              content_ingredients: { include: { ingredient: { include: { ingredient_units: { include: { unit: true } }, product: true } } } },
            },
          },
        },
      });
      reply.code(201).send(mapPublicationDetails(publication));
    } catch (err: any) {
      reply.code(500).send({ error: err.message });
    }
  },

  readAll: async (req, reply) => {
    try {
      const { page, limit, skip } = getPagination(req.query);

      let types = req.query.type ?? [];
      if (!Array.isArray(types)) types = [types];

      let typeIds: string[] = [];
      if (types.length) {
        const allowedTypes = await prisma.category.findMany({
          where: {
            type: "PublicationType",
            OR: types.map(t => ({ str_value: { equals: t, mode: "insensitive" } })),
          },
        });
        typeIds = allowedTypes.map(t => t.category_id);
      }

      const where: any = {
        public: true,
        published: true,
      };

      if (types.length) {
        where.type = {
          is: {
            str_value: { in: types, mode: "insensitive" }
          }
        };
      }


      const [total, publications] = await Promise.all([
        prisma.publication.count({ where }),
        prisma.publication.findMany({
          where,
          skip,
          take: limit,
          orderBy: { publication_id: "desc" },
          include: { type: true, style: true, author: true },
        }),
      ]);

      reply.send({
        data: publications.map(mapPublicationListItem),
        pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
      });
    } catch (err: any) {
      reply.code(500).send({ error: err.message });
    }
  },


  readOne: async (req: FastifyRequest<{ Params: ParamsWithId }>, reply: FastifyReply) => {
    const { id } = req.params;

    if (!isUUID(id)) {
      reply.code(400).send({ error: "Invalid UUID format" });
      return;
    }

    try {
      const pub = await prisma.publication.findUnique({
        where: { publication_id: id },
        include: {
          type: true,
          style: true,
          author: true,
          reviews: true,
          contents: {
            include: {
              content_segments: {
                include: { 
                  segment: { 
                    include: { 
                      segment_prep_time: { 
                        include: { 
                          prep_time: { 
                            include: { 
                              prep_time_categories: { include: { category: true } } 
                            } 
                          } 
                        } 
                      } 
                    } 
                  } 
                },
              },
              content_prep_times: { include: { prep_time: { include: { prep_time_categories: { include: { category: true } } } } } },
              content_ingredients: { include: { ingredient: { include: { ingredient_units: { include: { unit: true } }, product: true } } } },
            },
          },
        },
      });

      if (!pub) {
        reply.code(404).send({ error: "Publication not found" });
        return;
      }

      reply.send(mapPublicationDetails(pub));
    } catch (err: any) {
      reply.code(500).send({ error: err.message });
    }
  },

  update: async (req: FastifyRequest<{ Params: ParamsWithId; Body: Partial<PublicationBody> }>, reply: FastifyReply) => {
    const { id } = req.params;

    if (!isUUID(id)) {
      reply.code(400).send({ error: "Invalid UUID format" });
      return;
    }

    try {
      const updated = await prisma.publication.update({
        where: { publication_id: id },
        data: req.body,
        include: {
          type: true,
          style: true,
          author: true,
          reviews: true,
          contents: {
            include: {
              content_segments: {
                include: { 
                  segment: { 
                    include: { 
                      segment_prep_time: { 
                        include: { 
                          prep_time: { 
                            include: { 
                              prep_time_categories: { include: { category: true } } 
                            } 
                          } 
                        } 
                      } 
                    } 
                  } 
                },
              },
              content_prep_times: { include: { prep_time: { include: { prep_time_categories: { include: { category: true } } } } } },
              content_ingredients: { include: { ingredient: { include: { ingredient_units: { include: { unit: true } }, product: true } } } },
            },
          },
        },
      });
      reply.send(mapPublicationDetails(updated));
    } catch (err: any) {
      if (err.code === 'P2025') {
        reply.code(404).send({ error: "Publication not found" });
      } else {
        reply.code(500).send({ error: err.message });
      }
    }
  },

  delete: async (req: FastifyRequest<{ Params: ParamsWithId }>, reply: FastifyReply) => {
    const { id } = req.params;

    if (!isUUID(id)) {
      reply.code(400).send({ error: "Invalid UUID format" });
      return;
    }

    try {
      await prisma.publication.delete({ 
        where: { publication_id: id } 
      });
      reply.send({ success: true });
    } catch (err: any) {
      if (err.code === 'P2025') {
        reply.code(404).send({ error: "Publication not found" });
      } else {
        reply.code(500).send({ error: err.message });
      }
    }
  },

  advancedRoutes: (path: string, fastify: FastifyInstance) => {
    fastify.get(`${path}/:id/reviews`, async (req: FastifyRequest<{ Params: ParamsWithId }>, reply: FastifyReply) => {
      const { id } = req.params;

      if (!isUUID(id)) {
        reply.code(400).send({ error: "Invalid UUID format" });
        return;
      }

      try {
        const pub = await prisma.publication.findUnique({
          where: { publication_id: id },
          include: { reviews: true },
        });

        if (!pub) {
          reply.code(404).send({ error: "Publication not found" });
          return;
        }

        reply.send((pub.reviews ?? []).map(mapReview));
      } catch (err: any) {
        reply.code(500).send({ error: err.message });
      }
    });
  },
};

export default publicationController;