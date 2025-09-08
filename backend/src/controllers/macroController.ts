import { FastifyRequest, FastifyReply, FastifyInstance } from "fastify";
import { PrismaClient } from "@prisma/client";
import { CRUDController } from "./crudController";

const prisma = new PrismaClient();

interface MacroBody {
  calories?: number;
  protein?: number;
  fiber?: number;
  sugar?: number;
  saturated?: number;
  trans?: number;
  caffein?: number;
}

interface MacroParams {
  id: string;
}

export const macroController: CRUDController<MacroBody, MacroParams> & {
  getMacroProducts: (req: FastifyRequest<{ Params: MacroParams }>, reply: FastifyReply) => Promise<any>;
} = {
  create: async (req, reply) => {
    const macro = await prisma.macro.create({ data: req.body });
    reply.code(201).send(macro);
  },

  readAll: async (_req, reply) => {
    const macros = await prisma.macro.findMany();
    reply.send(macros);
  },

  readOne: async (req, reply) => {
    const { id } = req.params;
    const macro = await prisma.macro.findUnique({ where: { macroId: id } });
    reply.send(macro ?? { error: "Not found" });
  },

  update: async (req, reply) => {
    const { id } = req.params;
    const updated = await prisma.macro.update({ where: { macroId: id }, data: req.body });
    reply.send(updated);
  },

  delete: async (req, reply) => {
    const { id } = req.params;
    await prisma.macro.delete({ where: { macroId: id } });
    reply.send({ success: true });
  },

  getMacroProducts: async (req, reply) => {
    const { id } = req.params;
    const macro = await prisma.macro.findUnique({
      where: { macroId: id },
      include: { products: true },
    });
    reply.send(macro ?? { error: "Not found" });
  },

  advancedRoutes: (path: string, fastify: FastifyInstance) => {
    fastify.get(`${path}/:id/products`, macroController.getMacroProducts);
  },
};
