import { FastifyRequest, FastifyReply } from "fastify";
import { PrismaClient } from "@prisma/client";
import { validate as isUUID } from "uuid";
import { CRUDController } from "./crudController.js";
import {
  PublicationDetails,
  PublicationType,
  ContentDetails,
  SegmentDetails,
  ContentPrepTime,
  PublicationReview,
} from "../types/publication";

const prisma = new PrismaClient();

// --- Utility functions ---
function getPagination(query: { page?: string; limit?: string }) {
  const page = parseInt(query.page ?? "1", 10);
  const limit = parseInt(query.limit ?? "10", 10);
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

const mapPrepTime = (prep: any): ContentPrepTime => ({
  prepTimeId: prep.prep_time_id,
  duration: prep.duration,
  category: prep.prepTimeCategories?.[0]?.category && {
    categoryId: prep.prepTimeCategories[0].category.category_id,
    strValue: prep.prepTimeCategories[0].category.str_value,
    type: prep.prepTimeCategories[0].category.type,
  },
});

const mapSegment = (seg: any): SegmentDetails => ({
  segmentId: seg.segment_id,
  title: seg.title,
  paragraph: seg.paragraph,
  order: seg.order_num ?? 0,
  prepTimes: (seg.segment_prep_time ?? []).map((spt: any) => mapPrepTime(spt.prep_time)),
});

const mapContent = (content: any, includeIngredients = true): ContentDetails => ({
  contentId: content.content_id,
  totalPrepTime: content.total_prep_time,
  servings: content.servings,
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

// --- Controller ---
export const publicationController: CRUDController<
  PublicationType,
  { id: string },
  { page?: string; limit?: string; type?: string[] }
> & {
  readAll: (req: FastifyRequest, reply: FastifyReply) => Promise<any>;
  readOne: (req: FastifyRequest, reply: FastifyReply) => Promise<any>;
  readReview: (req: FastifyRequest, reply: FastifyReply) => Promise<any>;
  readPublication: (req: FastifyRequest, reply: FastifyReply) => Promise<any>;
} = {
  create: async (req, reply) => {
    try {
      const publication = await prisma.publication.create({ data: req.body as any });
      reply.code(201).send(publication);
    } catch (err: any) {
      reply.code(500).send({ error: err.message });
    }
  },

  update: async (req: FastifyRequest<{ Params: ParamsWithId }>, reply) => {
    try {
      const updated = await prisma.publication.update({
        where: { publication_id: req.params.id },
        data: req.body as any,
      });
      reply.send(updated);
    } catch (err: any) {
      reply.code(500).send({ error: err.message });
    }
  },

  delete: async (req: FastifyRequest<{ Params: ParamsWithId }>, reply) => {
    try {
      await prisma.publication.delete({ where: { publication_id: req.params.id } });
      reply.send({ success: true });
    } catch (err: any) {
      reply.code(500).send({ error: err.message });
    }
  },

  // --- List all publications ---
  readAll: async (req, reply) => {
    try {
      const { page, limit, skip } = getPagination(req.query);
      const types = req.query.type ?? [];

      let typeIds: string[] = [];
      if (types.length) {
        const allowedTypes = await prisma.category.findMany({
          where: { str_value: { in: types }, type: "PublicationType" },
        });
        typeIds = allowedTypes.map((t) => t.category_id);
      }

      const where = { public: true, published: true, ...(typeIds.length ? { type_id: { in: typeIds } } : {}) };

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
        data: publications.map((p) => ({
          publicationId: p.publication_id,
          title: p.title,
          description: p.description,
          note: p.note,
          thumbnail: p.thumbnail,
          type: p.type && { categoryId: p.type.category_id, strValue: p.type.str_value, type: p.type.type },
          style: p.style && { categoryId: p.style.category_id, strValue: p.style.str_value, type: p.style.type },
          author: p.author && { categoryId: p.author.category_id, strValue: p.author.str_value, type: p.author.type },
        })),
        pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
      });
    } catch (err: any) {
      reply.code(500).send({ error: err.message });
    }
  },

  // --- Get a single publication with everything (for admin / preview) ---
  readOne: async (req, reply) => {
    return publicationController.readPublication(req, reply);
  },

  // --- Get a publication for review route (reviews + no ingredients) ---
  readReview: async (req, reply) => {
    try {
      const { id } = req.params;
      if (!isUUID(id)) return reply.code(400).send({ error: "Invalid UUID format" });

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
                              prep_time_categories: { 
                                include: { category: true } 
                              } 
                            } 
                          } 
                        } 
                      } 
                    } 
                  } 
                },
              },
              content_prep_times: { 
                include: { 
                  prep_time: { 
                    include: { 
                      prep_time_categories: { 
                        include: { category: true } 
                      } 
                    } 
                  } 
                } 
              },
            },
          },
        },
      });

      if (!pub) return reply.code(404).send({ error: "Not found" });

      const response: PublicationDetails = {
        publicationId: pub.publication_id,
        title: pub.title,
        description: pub.description,
        note: pub.note,
        public: pub.public,
        published: pub.published,
        thumbnail: pub.thumbnail,
        type: pub.type && { categoryId: pub.type.category_id, strValue: pub.type.str_value, type: pub.type.type },
        style: pub.style && { categoryId: pub.style.category_id, strValue: pub.style.str_value, type: pub.style.type },
        author: pub.author && { categoryId: pub.author.category_id, strValue: pub.author.str_value, type: pub.author.type },
        reviews: (pub.reviews ?? []).map(mapReview),
        contents: (pub.contents ?? []).map((c) => mapContent(c, false)),
      };

      reply.send(response);
    } catch (err: any) {
      reply.code(500).send({ error: err.message });
    }
  },

  // --- Get a publication for normal route (ingredients + review ids) ---
  readPublication: async (req, reply) => {
    try {
      const { id } = req.params;
      if (!isUUID(id)) return reply.code(400).send({ error: "Invalid UUID format" });

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
                              prep_time_categories: { 
                                include: { category: true } 
                              } 
                            } 
                          } 
                        } 
                      } 
                    } 
                  } 
                },
              },
              content_prep_times: { 
                include: { 
                  prep_time: { 
                    include: { 
                      prep_time_categories: { 
                        include: { category: true } 
                      } 
                    } 
                  } 
                } 
              },
              content_ingredients: { 
                include: { 
                  ingredient: { 
                    include: { 
                      ingredient_units: { 
                        include: { unit: true } 
                      }, 
                      product: true 
                    } 
                  } 
                } 
              },
            },
          },
        },
      });

      if (!pub) return reply.code(404).send({ error: "Not found" });

      const response: PublicationDetails = {
        publicationId: pub.publication_id,
        title: pub.title,
        description: pub.description,
        note: pub.note,
        public: pub.public,
        published: pub.published,
        thumbnail: pub.thumbnail,
        type: pub.type && { categoryId: pub.type.category_id, strValue: pub.type.str_value, type: pub.type.type },
        style: pub.style && { categoryId: pub.style.category_id, strValue: pub.style.str_value, type: pub.type.type },
        author: pub.author && { categoryId: pub.author.category_id, strValue: pub.author.str_value, type: pub.author.type },
        reviews: (pub.reviews ?? []).map((r) => ({ reviewId: r.review_id } as PublicationReview)),
        contents: (pub.contents ?? []).map((c) => mapContent(c, true)),
      };

      reply.send(response);
    } catch (err: any) {
      reply.code(500).send({ error: err.message });
    }
  },
};

export default publicationController;