import { FastifyRequest, FastifyReply, FastifyInstance } from "fastify";
import { PrismaClient } from "@prisma/client";
import { CRUDController } from "./crudController.js";

const prisma = new PrismaClient();

interface IngredientBody {
  quantity?: number;
  isRecipeId?: string;
  productId: string;
}

interface IngredientParams {
  id: string;
}

export const ingredientController: CRUDController<IngredientBody, IngredientParams> & {
  getIngredientWithProduct: (req: FastifyRequest<{ Params: IngredientParams }>, reply: FastifyReply) => Promise<any>;
  getIngredientUnits: (req: FastifyRequest<{ Params: IngredientParams }>, reply: FastifyReply) => Promise<any>;
} = {
  create: async (req, reply) => {
    const ingredient = await prisma.ingredient.create({ data: req.body });
    reply.code(201).send(ingredient);
  },

  readAll: async (_req, reply) => {
    const ingredients = await prisma.ingredient.findMany();
    reply.send(ingredients);
  },

  readOne: async (req, reply) => {
    const { id } = req.params;
    const ingredient = await prisma.ingredient.findUnique({ where: { ingredientId: id } });
    reply.send(ingredient ?? { error: "Not found" });
  },

  update: async (req, reply) => {
    const { id } = req.params;
    const updated = await prisma.ingredient.update({ where: { ingredientId: id }, data: req.body });
    reply.send(updated);
  },

  delete: async (req, reply) => {
    const { id } = req.params;
    await prisma.ingredient.delete({ where: { ingredientId: id } });
    reply.send({ success: true });
  },

  // Routes avancées
  getIngredientWithProduct: async (req, reply) => {
    const { id } = req.params;
    const ingredient = await prisma.ingredient.findUnique({
      where: { ingredientId: id },
      include: { product: true },
    });
    reply.send(ingredient ?? { error: "Not found" });
  },

  getIngredientUnits: async (req, reply) => {
    const { id } = req.params;
    const ingredient = await prisma.ingredient.findUnique({
      where: { ingredientId: id },
      include: { units: { include: { unit: true } } },
    });
    reply.send(ingredient ?? { error: "Not found" });
  },

  advancedRoutes: (path: string, fastify: FastifyInstance) => {
    fastify.get(`${path}/:id/product`, ingredientController.getIngredientWithProduct);
    fastify.get(`${path}/:id/units`, ingredientController.getIngredientUnits);
  },
};
