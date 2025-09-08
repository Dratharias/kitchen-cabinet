import { FastifyRequest, FastifyReply, FastifyInstance } from "fastify";
import { PrismaClient } from "@prisma/client";
import { CRUDController } from "./crudController";

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

interface PublicationSearchQuery {
  q?: string;                     // recherche texte
  typeId?: string;                 // filtre type
  styleId?: string;                // filtre style
  tags?: string[];                 // ex: ["vegan", "gluten-free"]
  ingredients?: string[];          // ex: ["chicken", "garlic"]
  maxPrepTime?: number;            // en minutes
  minCalories?: number;
  maxCalories?: number;
  servings?: number;               // portions exactes
  sortBy?: "title" | "prepTime" | "calories" | "createdAt";
  sortOrder?: "asc" | "desc";
  take?: number;
  skip?: number;
}

interface PublicationParams {
  id: string;
}

export const publicationController: CRUDController<PublicationBody, PublicationParams> & {
  getPublicationsWithRelations: (req: FastifyRequest, reply: FastifyReply) => Promise<any>;
  getPublicationDetails: (req: FastifyRequest<{ Params: PublicationParams }>, reply: FastifyReply) => Promise<any>;
  countPublicationsByCategory: (req: FastifyRequest, reply: FastifyReply) => Promise<any>;
} = {
  create: async (req, reply) => {
    const data = req.body;
    const publication = await prisma.publication.create({ data });
    reply.code(201).send(publication);
  },

  readAll: async (_req, reply) => {
    const publications = await prisma.publication.findMany();
    reply.send(publications);
  },

  readOne: async (req, reply) => {
    const { id } = req.params;
    const publication = await prisma.publication.findUnique({ where: { publicationId: id } });
    reply.send(publication ?? { error: "Not found" });
  },

  update: async (req, reply) => {
    const { id } = req.params;
    const data = req.body;
    const updated = await prisma.publication.update({ where: { publicationId: id }, data });
    reply.send(updated);
  },

  delete: async (req, reply) => {
    const { id } = req.params;
    await prisma.publication.delete({ where: { publicationId: id } });
    reply.send({ success: true });
  },

  // Routes avancées
  getPublicationsWithRelations: async (_req, reply) => {
    const publications = await prisma.publication.findMany({
      include: {
        type: true,
        style: true,
        author: true,
        ingredients: true,
        reviews: true,
        resourcePublications: true,
      },
    });
    reply.send(publications);
  },

  getPublicationDetails: async (req, reply) => {
    const { id } = req.params;
    const publication = await prisma.publication.findUnique({
      where: { publicationId: id },
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
  },

  countPublicationsByCategory: async (_req, reply) => {
    const counts = await prisma.publication.groupBy({
      by: ["typeId"],
      _count: { _all: true },
    });
    reply.send(counts);
  },

  search: async (
    req: FastifyRequest<{ Querystring: PublicationSearchQuery }>,
    reply: FastifyReply
    ) => {
    const {
        q,
        typeId,
        styleId,
        tags,
        ingredients,
        maxPrepTime,
        minCalories,
        maxCalories,
        servings,
        sortBy = "title",
        sortOrder = "asc",
        take = 50,
        skip = 0,
    } = req.query;
    
    const publicationWhere: any = {
        published: true,
        ...(typeId && { typeId }),
        ...(styleId && { styleId }),
        ...(q && {
        OR: [
            { title: { contains: q, mode: "insensitive" } },
            { description: { hasSome: [q] } },
        ],
        }),
        ...(tags && tags.length > 0 && {
        tags: {
            some: {
            category: { strValue: { in: tags }, type: "Tag" },
            },
        },
        }),
    };

    const contentWhere: any = {
        ...(maxPrepTime && { totalPrepTime: { lte: maxPrepTime } }),
        ...(servings && { servings: { gte: servings } }),
        ...(minCalories && { macro: { calories: { gte: minCalories } } }),
        ...(maxCalories && { macro: { calories: { lte: maxCalories } } }),
        ...(ingredients && ingredients.length > 0 && {
        ingredients: {
            some: {
            product: { name: { in: ingredients, mode: "insensitive" } },
            },
        },
        }),
    };

    const orderBy: any =
        sortBy === "prepTime"
        ? { resource: { resourceContents: { some: { content: { totalPrepTime: sortOrder } } } } }
        : sortBy === "calories"
        ? { resource: { resourceContents: { some: { content: { macro: { calories: sortOrder } } } } } }
        : { [sortBy]: sortOrder };

    const publications = await prisma.publication.findMany({
        where: publicationWhere,
        include: {
        type: true,
        style: true,
        author: true,
        resource: {
            include: {
            resourceContents: {
                include: {
                content: {
                    include: {
                    category: true,
                    ingredients: {
                        include: { product: true, units: { include: { unit: true } } },
                    },
                    macro: true,
                    },
                    where: contentWhere,
                },
                },
            },
            },
        },
        tags: { include: { category: true } },
        reviews: true,
        },
        orderBy,
        take,
        skip,
    });

    reply.send(publications);
  },

  advancedRoutes: (path: string, fastify: FastifyInstance) => {
    fastify.get(`${path}/with-relations`, publicationController.getPublicationsWithRelations);
    fastify.get(`${path}/:id/details`, publicationController.getPublicationDetails);
    fastify.get(`${path}/count-by-type`, publicationController.countPublicationsByCategory);
  },
};
