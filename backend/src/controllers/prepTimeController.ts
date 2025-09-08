import { FastifyRequest, FastifyReply, FastifyInstance } from "fastify";
import { PrismaClient } from "@prisma/client";
import { CRUDController } from "./crudController";

const prisma = new PrismaClient();

interface PrepTimeBody {
  duration: number;
  categoryId: string;
}

interface PrepTimeParams {
  id: string;
}

export const prepTimeController: CRUDController<PrepTimeBody, PrepTimeParams> & {
  getPrepTimesByCategory: (req: FastifyRequest<{ Params: PrepTimeParams }>, reply: FastifyReply) => Promise<any>;
} = {
  create: async (req, reply) => {
    const prepTime = await prisma.prepTime.create({ data: req.body });
    reply.code(201).send(prepTime);
  },

  readAll: async (_req, reply) => {
    const prepTimes = await prisma.prepTime.findMany();
    reply.send(prepTimes);
  },

  readOne: async (req, reply) => {
    const { id } = req.params;
    const prepTime = await prisma.prepTime.findUnique({ where: { prepTimeId: id } });
    reply.send(prepTime ?? { error: "Not found" });
  },

  update: async (req, reply) => {
    const { id } = req.params;
    const updated = await prisma.prepTime.update({ where: { prepTimeId: id }, data: req.body });
    reply.send(updated);
  },

  delete: async (req, reply) => {
    const { id } = req.params;
    await prisma.prepTime.delete({ where: { prepTimeId: id } });
    reply.send({ success: true });
  },

  getPrepTimesByCategory: async (req, reply) => {
    const { id } = req.params;
    const prepTimes = await prisma.prepTime.findMany({ where: { categoryId: id } });
    reply.send(prepTimes);
  },

  advancedRoutes: (path: string, fastify: FastifyInstance) => {
    fastify.get(`${path}/category/:id`, prepTimeController.getPrepTimesByCategory);
  },
};
