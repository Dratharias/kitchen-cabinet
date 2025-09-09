import { FastifyRequest, FastifyReply, FastifyInstance } from "fastify";
import { PrismaClient, Publication } from "@prisma/client";
import { CRUDController } from "./crudController.js";

const prisma = new PrismaClient();

// --- Types ---
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

// --- Helper pagination ---
function getPagination(query: PaginationQuery) {
  const page = parseInt(query.page ?? "1", 10);
  const limit = parseInt(query.limit ?? "10", 10);
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

// --- Controller ---
export const publicationController: CRUDController<
  PublicationBody,
  PublicationParams,
  PaginationQuery
> & {
  getFeeds: (req: FastifyRequest<{ Querystring: PaginationQuery }>, reply: FastifyReply) => Promise<any>;
  getLibrary: (req: FastifyRequest<{ Querystring: PaginationQuery }>, reply: FastifyReply) => Promise<any>;
  getPublicationDetails: (req: FastifyRequest<{ Params: PublicationParams }>, reply: FastifyReply) => Promise<any>;
  countPublicationsByCategory: (req: FastifyRequest, reply: FastifyReply) => Promise<any>;
} = {
  // --- CRUD standard ---
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
      const publication = await prisma.publication.findUnique({
        where: { publicationId: req.params.id },
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

  // --- Feeds : Article | Recipe ---
  getFeeds: async (req, reply) => {
    try {
      const { page, limit, skip } = getPagination(req.query);

      const where = {
        published: true,
        public: true,
        type: { strValue: { in: ["Article", "Recipe"] } },
      };

      const [total, feeds] = await Promise.all([
        prisma.publication.count({ where }),
        prisma.publication.findMany({
          where,
          skip,
          take: limit,
          select: {
            publicationId: true,
            title: true,
            type: true,
            style: true,
            thumbnail: true,
            description: true,
          },
        }),
      ]);

      reply.send({
        data: feeds,
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

  // --- Library : Book | Review ---
  getLibrary: async (req, reply) => {
    try {
      const { page, limit, skip } = getPagination(req.query);

      const where = {
        published: true,
        public: true,
        type: { strValue: { in: ["Book", "Review"] } },
      };

      const [total, library] = await Promise.all([
        prisma.publication.count({ where }),
        prisma.publication.findMany({
          where,
          skip,
          take: limit,
          include: {
            type: true,
            style: true,
            author: true,
            ingredients: {
              include: { product: true, units: { include: { unit: true } } },
            },
            reviews: true,
            resourcePublications: { include: { resource: true } },
          },
        }),
      ]);

      reply.send({
        data: library,
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

  // --- Publication Details ---
  getPublicationDetails: async (req, reply) => {
    try {
      const publication = await prisma.publication.findUnique({
        where: { publicationId: req.params.id },
        include: {
          type: true,
          style: true,
          author: true,
          ingredients: { include: { product: true, units: { include: { unit: true } } } },
          reviews: true,
          resourcePublications: { include: { resource: true } },
        },
      });
      reply.send(publication ?? { error: "Not found" });
    } catch (err: any) {
      reply.code(500).send({ error: err.message });
    }
  },

  // --- Count Publications by Type ---
  countPublicationsByCategory: async (_req, reply) => {
    try {
      const counts = await prisma.publication.groupBy({
        by: ["typeId"],
        _count: { _all: true },
      });
      reply.send(counts);
    } catch (err: any) {
      reply.code(500).send({ error: err.message });
    }
  },

  // --- Advanced Routes ---
  advancedRoutes: (path, fastify) => {
    fastify.get<{ Querystring: PaginationQuery }>(`${path}/feeds`, publicationController.getFeeds);
    fastify.get<{ Querystring: PaginationQuery }>(`${path}/library`, publicationController.getLibrary);
    fastify.get<{ Params: PublicationParams }>(`${path}/:id/details`, publicationController.getPublicationDetails);
    fastify.get(`${path}/count-by-type`, publicationController.countPublicationsByCategory);
  },
};