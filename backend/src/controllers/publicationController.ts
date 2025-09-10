import { FastifyRequest, FastifyReply, FastifyInstance } from "fastify";
import { PrismaClient } from "@prisma/client";
import { CRUDController } from "./crudController.js";
import { validate as isUUID } from "uuid";

const prisma = new PrismaClient();

export interface PublicationBody {
  title: string;
  description?: string[];
  note?: string[];
  public?: boolean;
  published?: boolean;
  thumbnail?: string;
  typeId?: string;
  styleId?: string;
  authorId?: string;
  resourceId?: string;
}

export interface PublicationParams {
  id: string;
}

export interface PaginationQuery {
  page?: string;
  limit?: string;
}

export interface ReviewDetailsProps {
  reviewId: string;
  rating?: number;
  comment?: string[];
  description?: string[];
  buyAgain?: "Oui" | "Non" | "Incertain" | "Non prioritaire";
  dateReview: string;
  productName: string;
  productThumbnail?: string;
  categoryName?: string;
  authorOrSupplier?: string;
}

// --- Helpers ---
function getPagination(query: PaginationQuery) {
  const page = parseInt(query.page ?? "1", 10);
  const limit = parseInt(query.limit ?? "10", 10);
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

function mapBuyAgain(value: string | null | undefined): ReviewDetailsProps["buyAgain"] {
  switch (value) {
    case "T": return "Oui";
    case "F": return "Non";
    case "M": return "Incertain";
    case "N": return "Non prioritaire";
    default: return "Incertain";
  }
}

// --- Controller ---
export const publicationController: CRUDController<
  PublicationBody,
  PublicationParams,
  PaginationQuery
> & {
  getPublicAndPublishedFeeds: (req: FastifyRequest<{ Querystring: PaginationQuery }>, reply: FastifyReply) => Promise<any>;
  getPublicAndPublishedReviews: (req: FastifyRequest<{ Querystring: PaginationQuery }>, reply: FastifyReply) => Promise<any>;
  getPublicationFeed: (req: FastifyRequest<{ Params: PublicationParams }>, reply: FastifyReply) => Promise<any>;
  getPublicationReview: (req: FastifyRequest<{ Params: PublicationParams }>, reply: FastifyReply) => Promise<any>;
} = {
  create: async (req, reply) => {
    try {
      const publication = await prisma.publication.create({ data: req.body });
      reply.code(201).send(publication);
    } catch (err: any) {
      reply.code(500).send({ error: err.message });
    }
  },

  readAll: async (req, reply) => {
    try {
      const { page, limit, skip } = getPagination(req.query);
      const [total, publications] = await Promise.all([
        prisma.publication.count(),
        prisma.publication.findMany({
          skip,
          take: limit,
          orderBy: { publicationId: "desc" },
        }),
      ]);

      reply.send({
        data: publications,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (err: any) {
      reply.code(500).send({ error: err.message });
    }
  },

  readOne: async (req, reply) => {
    try {
      const { id } = req.params;
      if (!isUUID(id)) {
        return reply.code(400).send({ error: "Invalid UUID format" });
      }

      const publication = await prisma.publication.findUnique({
        where: { publicationId: id },
      });
      reply.send(publication ?? { error: "Not found" });
    } catch (err: any) {
      reply.code(500).send({ error: err.message });
    }
  },

  update: async (req, reply) => {
    try {
      const updated = await prisma.publication.update({
        where: { publicationId: req.params.id },
        data: req.body,
      });
      reply.send(updated);
    } catch (err: any) {
      reply.code(500).send({ error: err.message });
    }
  },

  delete: async (req, reply) => {
    try {
      await prisma.publication.delete({ where: { publicationId: req.params.id } });
      reply.send({ success: true });
    } catch (err: any) {
      reply.code(500).send({ error: err.message });
    }
  },

  getPublicAndPublishedFeeds: async (req, reply) => {
    try {
      const { page, limit, skip } = getPagination(req.query);

      const where = {
        public: true,
        published: true,
        type: { strValue: { in: ["Article", "Recipe"] } },
      };

      const [total, feeds] = await Promise.all([
        prisma.publication.count({ where }),
        prisma.publication.findMany({
          where,
          skip,
          take: limit,
          include: {
            type: true,
            style: true,
            author: true,
            resourcePublications: {
              include: {
                resource: {
                  include: {
                    contents: true, // content only, pas contentPrepTime
                  },
                },
              },
            },
            reviews: true,
          },
        }),
      ]);

      reply.send({
        data: feeds,
        pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
      });
    } catch (err: any) {
      reply.code(500).send({ error: err.message });
    }
  },

  getPublicationFeed: async (req, reply) => {
    try {
      const publication = await prisma.publication.findUnique({
        where: { publicationId: req.params.id },
        include: {
          type: true,
          style: true,
          author: true,
          resourcePublications: {
            include: {
              resource: {
                include: {
                  contents: true, // content only
                },
              },
            },
          },
          reviews: true,
        },
      });
      reply.send(publication ?? { error: "Not found" });
    } catch (err: any) {
      reply.code(500).send({ error: err.message });
    }
  },

  getPublicAndPublishedReviews: async (req, reply) => {
    try {
      const { page, limit, skip } = getPagination(req.query);
      const where = { public: true, published: true, type: { strValue: { in: ["Review", "Book"] } } };

      const [total, reviews] = await Promise.all([
        prisma.publication.count({ where }),
        prisma.publication.findMany({
          where,
          skip,
          take: limit,
          include: {
            type: true,
            style: true,
            author: true,
            reviews: {
              include: {
                product: {
                  include: { category: true },
                },
              },
            },
            resourcePublications: { include: { resource: true } },
          },
        }),
      ]);

      reply.send({
        data: reviews,
        pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
      });
    } catch (err: any) {
      reply.code(500).send({ error: err.message });
    }
  },

  getPublicationReview: async (req, reply) => {
    try {
      const publication = await prisma.publication.findUnique({
        where: { publicationId: req.params.id },
        include: {
          type: true,
          style: true,
          author: true,
          reviews: {
            include: {
              product: { include: { category: true } },
            },
          },
          resourcePublications: { include: { resource: true } },
        },
      });

      if (!publication) return reply.code(404).send({ error: "Not found" });

      const mappedReviews: ReviewDetailsProps[] = publication.reviews.map((r) => ({
        reviewId: r.reviewId,
        rating: r.rating ?? 0,
        comment: r.comment ?? [],
        description: r.description ?? [],
        buyAgain: mapBuyAgain(r.buyAgain),
        dateReview: r.dateReview.toISOString(),
        productName: r.product?.name ?? "Produit inconnu",
        productThumbnail: r.product?.enName ?? undefined,
        categoryName: r.product?.category?.strValue ?? "-",
        authorOrSupplier: publication.author?.strValue ?? "-",
      }));

      reply.send({ ...publication, reviews: mappedReviews });
    } catch (err: any) {
      reply.code(500).send({ error: err.message });
    }
  },

  advancedRoutes: (path: string, fastify: FastifyInstance) => {
    // --- Feeds ---
    // Liste publique et publiée
    fastify.get(`${path}/feeds`, publicationController.getPublicAndPublishedFeeds);

    // Détail d'une publication (UUID requis)
    fastify.get<{ Params: PublicationParams }>(
      `${path}/feeds/:id`,
      async (req, reply) => {
        const { id } = req.params;
        if (!isUUID(id)) return reply.code(400).send({ error: "Invalid UUID format" });
        return publicationController.getPublicationFeed(req, reply);
      }
    );

    // --- Reviews ---
    // Liste publique et publiée
    fastify.get(`${path}/reviews`, publicationController.getPublicAndPublishedReviews);

    // Détail d'une review (UUID requis)
    fastify.get<{ Params: PublicationParams }>(
      `${path}/reviews/:id`,
      async (req, reply) => {
        const { id } = req.params;
        if (!isUUID(id)) return reply.code(400).send({ error: "Invalid UUID format" });
        return publicationController.getPublicationReview(req, reply);
      }
    );
  }
};
