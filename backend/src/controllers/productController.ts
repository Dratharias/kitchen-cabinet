import { FastifyRequest, FastifyReply, FastifyInstance } from "fastify";
import { PrismaClient } from "@prisma/client";
import { CRUDController } from "./crudController";

const prisma = new PrismaClient();

interface ProductBody {
  name: string;
  enName?: string;
  macroId?: string;
  categoryId: string;
}

interface ProductParams {
  id: string;
}

export const productController: CRUDController<ProductBody, ProductParams> & {
  getProductDetails: (req: FastifyRequest<{ Params: ProductParams }>, reply: FastifyReply) => Promise<any>;
} = {
  create: async (req, reply) => {
    const product = await prisma.product.create({ data: req.body });
    reply.code(201).send(product);
  },

  readAll: async (_req, reply) => {
    const products = await prisma.product.findMany();
    reply.send(products);
  },

  readOne: async (req, reply) => {
    const { id } = req.params;
    const product = await prisma.product.findUnique({ where: { productId: id } });
    reply.send(product ?? { error: "Not found" });
  },

  update: async (req, reply) => {
    const { id } = req.params;
    const updated = await prisma.product.update({ where: { productId: id }, data: req.body });
    reply.send(updated);
  },

  delete: async (req, reply) => {
    const { id } = req.params;
    await prisma.product.delete({ where: { productId: id } });
    reply.send({ success: true });
  },

  getProductDetails: async (req, reply) => {
    const { id } = req.params;
    const product = await prisma.product.findUnique({
      where: { productId: id },
      include: {
        macro: true,
        category: true,
        ingredients: { include: { units: { include: { unit: true } }, isRecipe: true } },
        reviews: true,
      },
    });
    reply.send(product ?? { error: "Not found" });
  },

  advancedRoutes: (path: string, fastify: FastifyInstance) => {
    fastify.get(`${path}/:id/details`, productController.getProductDetails);
  },
};
