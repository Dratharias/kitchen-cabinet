import { FastifyRequest, FastifyReply, FastifyInstance } from "fastify";
import { PrismaClient } from "@prisma/client";
import { CRUDController } from "./crudController.js";

const prisma = new PrismaClient();

interface ContentBody {
  title: string;
  description?: string[];
  note?: string[];
  categoryId: string;
}

interface ContentParams {
  id: string;
}

export const contentController: CRUDController<ContentBody, ContentParams> & {
  getContentWithResources: (req: FastifyRequest<{ Params: ContentParams }>, reply: FastifyReply) => Promise<any>;
  getContentsByCategory: (req: FastifyRequest<{ Params: ContentParams }>, reply: FastifyReply) => Promise<any>;
} = {
  create: async (req, reply) => {
    const content = await prisma.content.create({ data: req.body });
    reply.code(201).send(content);
  },

  readAll: async (_req, reply) => {
    const contents = await prisma.content.findMany();
    reply.send(contents);
  },

  readOne: async (req, reply) => {
    const { id } = req.params;
    const content = await prisma.content.findUnique({ where: { contentId: id } });
    reply.send(content ?? { error: "Not found" });
  },

  update: async (req, reply) => {
    const { id } = req.params;
    const updated = await prisma.content.update({ where: { contentId: id }, data: req.body });
    reply.send(updated);
  },

  delete: async (req, reply) => {
    const { id } = req.params;
    await prisma.content.delete({ where: { contentId: id } });
    reply.send({ success: true });
  },

  getContentWithResources: async (req, reply) => {
    const { id } = req.params;
    const content = await prisma.content.findUnique({
      where: { contentId: id },
      include: { resources: { include: { resource: true } } },
    });
    reply.send(content ?? { error: "Not found" });
  },

  getContentsByCategory: async (req, reply) => {
    const { id } = req.params;
    const contents = await prisma.content.findMany({ where: { categoryId: id } });
    reply.send(contents);
  },

  advancedRoutes: (path: string, fastify: FastifyInstance) => {
    fastify.get(`${path}/:id/resources`, contentController.getContentWithResources);
    fastify.get(`${path}/category/:id`, contentController.getContentsByCategory);
  },
};
