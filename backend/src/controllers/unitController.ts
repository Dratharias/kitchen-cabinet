import { FastifyRequest, FastifyReply, FastifyInstance } from "fastify";
import { PrismaClient } from "@prisma/client";
import { CRUDController } from "./crudController.js";

const prisma = new PrismaClient();

interface UnitBody {
  name: string;
}

interface UnitParams {
  id: string;
}

export const unitController: CRUDController<UnitBody, UnitParams> & {
  getUnitIngredients: (req: FastifyRequest<{ Params: UnitParams }>, reply: FastifyReply) => Promise<any>;
} = {
  create: async (req, reply) => {
    const unit = await prisma.unit.create({ data: req.body });
    reply.code(201).send(unit);
  },

  readAll: async (_req, reply) => {
    const units = await prisma.unit.findMany();
    reply.send(units);
  },

  readOne: async (req, reply) => {
    const { id } = req.params;
    const unit = await prisma.unit.findUnique({ where: { unitId: id } });
    reply.send(unit ?? { error: "Not found" });
  },

  update: async (req, reply) => {
    const { id } = req.params;
    const updated = await prisma.unit.update({ where: { unitId: id }, data: req.body });
    reply.send(updated);
  },

  delete: async (req, reply) => {
    const { id } = req.params;
    await prisma.unit.delete({ where: { unitId: id } });
    reply.send({ success: true });
  },

  getUnitIngredients: async (req, reply) => {
    const { id } = req.params;
    const unit = await prisma.unit.findUnique({
      where: { unitId: id },
      include: { ingredientUnits: { include: { ingredient: true } } },
    });
    reply.send(unit ?? { error: "Not found" });
  },

  advancedRoutes: (path: string, fastify: FastifyInstance) => {
    fastify.get(`${path}/:id/ingredients`, unitController.getUnitIngredients);
  },
};
