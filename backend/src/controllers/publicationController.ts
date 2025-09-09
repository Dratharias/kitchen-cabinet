import { FastifyRequest, FastifyReply, FastifyInstance } from "fastify";
import { PrismaClient } from "@prisma/client";
import { CRUDController } from "./crudController.js";

const prisma = new PrismaClient();

interface PublicationBody {
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

interface PublicationParams { id: string; }

export const publicationController: CRUDController<PublicationBody, PublicationParams> & {
  getFeeds: (req: FastifyRequest, reply: FastifyReply) => Promise<any>;
  getLibrary: (req: FastifyRequest, reply: FastifyReply) => Promise<any>;
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

  readAll: async (_req, reply) => {
    try {
      const publications = await prisma.publication.findMany();
      reply.send(publications);
    } catch (err: any) {
      reply.code(500).send({ error: err.message });
    }
  },

  readOne: async (req, reply) => {
    try {
      const publication = await prisma.publication.findUnique({ where: { publicationId: req.params.id } });
      reply.send(publication ?? { error: "Not found" });
    } catch (err: any) {
      reply.code(500).send({ error: err.message });
    }
  },

  update: async (req, reply) => {
    try {
      const updated = await prisma.publication.update({ where: { publicationId: req.params.id }, data: req.body });
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
  getFeeds: async (_req, reply) => {
    try {
      const feeds = await prisma.publication.findMany({
        where: {
          published: true,
          public: true,
          type: { strValue: { in: ["Article", "Recipe"] } }
        },
        select: { publicationId: true, title: true, type: true, style: true, thumbnail: true, description: true }
      });
      reply.send(feeds);
    } catch (err: any) {
      reply.code(500).send({ error: err.message });
    }
  },

  // --- Library : Book | Review ---
  getLibrary: async (_req, reply) => {
    try {
      const library = await prisma.publication.findMany({
        where: {
          published: true,
          public: true,
          type: { strValue: { in: ["Book", "Review"] } }
        },
        include: {
          type: true,
          style: true,
          author: true,
          ingredients: { include: { product: true, units: { include: { unit: true } } } },
          reviews: true,
          resourcePublications: { include: { resource: true } },
        },
      });
      reply.send(library);
    } catch (err: any) {
      reply.code(500).send({ error: err.message });
    }
  },

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

  countPublicationsByCategory: async (_req, reply) => {
    try {
      const counts = await prisma.publication.groupBy({ by: ["typeId"], _count: { _all: true } });
      reply.send(counts);
    } catch (err: any) {
      reply.code(500).send({ error: err.message });
    }
  },

  advancedRoutes: (path: string, fastify: FastifyInstance) => {
    fastify.get(`${path}/feeds`, publicationController.getFeeds);
    fastify.get(`${path}/library`, publicationController.getLibrary);
    fastify.get(`${path}/:id/details`, publicationController.getPublicationDetails);
    fastify.get(`${path}/count-by-type`, publicationController.countPublicationsByCategory);
  },

};
