import { CRUDController } from "./crudController";
import { FastifyRequest, FastifyReply, FastifyInstance } from "fastify";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface CategoryBody {
  strValue: string;
  type: string;
  numValue?: number;
}

interface CategoryParams {
  id: string;
}

export const categoryController: CRUDController<CategoryBody, CategoryParams> & {
  getCategoriesWithCounts: (req: FastifyRequest, reply: FastifyReply) => Promise<any>;
  getCategoryWithProducts: (req: FastifyRequest<{ Params: CategoryParams }>, reply: FastifyReply) => Promise<any>;
  getCategoryContentsWithResources: (req: FastifyRequest<{ Params: CategoryParams }>, reply: FastifyReply) => Promise<any>;
  countProductsByType: (req: FastifyRequest, reply: FastifyReply) => Promise<any>;
} = {
  create: async (req, reply) => {
    const { strValue, type, numValue } = req.body;
    const category = await prisma.category.create({ data: { strValue, type, numValue } });
    reply.code(201).send(category);
  },

  readAll: async (_req, reply) => {
    const categories = await prisma.category.findMany();
    reply.send(categories);
  },

  readOne: async (req, reply) => {
    const { id } = req.params;
    const category = await prisma.category.findUnique({ where: { categoryId: id } });
    reply.send(category ?? { error: "Not found" });
  },

  update: async (req, reply) => {
    const { id } = req.params;
    const { strValue, type, numValue } = req.body;
    const updated = await prisma.category.update({
      where: { categoryId: id },
      data: { strValue, type, numValue },
    });
    reply.send(updated);
  },

  delete: async (req, reply) => {
    const { id } = req.params;
    await prisma.category.delete({ where: { categoryId: id } });
    reply.send({ success: true });
  },

  // Avanced Routes
  getCategoriesWithCounts: async (_req, reply) => {
    const data = await prisma.category.findMany({
      include: {
        products: true,
        contents: true,
        publicationsType: true,
        publicationsStyle: true,
        publicationsAuth: true,
      },
    });

    reply.send(data.map(c => ({
      categoryId: c.categoryId,
      strValue: c.strValue,
      type: c.type,
      numValue: c.numValue,
      productCount: c.products.length,
      contentCount: c.contents.length,
      publicationsCount: c.publicationsType.length + c.publicationsStyle.length + c.publicationsAuth.length
    })));
  },

  getCategoryWithProducts: async (req, reply) => {
    const { id } = req.params;
    const category = await prisma.category.findUnique({
      where: { categoryId: id },
      include: { products: { include: { macro: true } } },
    });
    reply.send(category ?? { error: "Not found" });
  },

  getCategoryContentsWithResources: async (req, reply) => {
    const { id } = req.params;
    const category = await prisma.category.findUnique({
      where: { categoryId: id },
      include: { contents: { include: { resources: { include: { resource: true } } } } },
    });
    reply.send(category ?? { error: "Not found" });
  },

  countProductsByType: async (_req, reply) => {
    const counts = await prisma.category.findMany({
      select: { type: true, _count: { select: { products: true } } },
    });
    reply.send(counts);
  },

  // Define advanced routes registration
  advancedRoutes: (path: string, fastify: FastifyInstance) => {
    fastify.get(`${path}/counts`, categoryController.getCategoriesWithCounts);
    fastify.get(`${path}/:id/products`, categoryController.getCategoryWithProducts);
    fastify.get(`${path}/:id/contents`, categoryController.getCategoryContentsWithResources);
    fastify.get(`${path}/by-type`, categoryController.countProductsByType);
  },
};