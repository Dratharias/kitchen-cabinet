import { FastifyRequest, FastifyReply, FastifyInstance } from "fastify";
import { PrismaClient } from "@prisma/client";
import { CRUDController } from "./crudController.js";

const prisma = new PrismaClient();

interface ResourceBody {
  urlId: string;
}

interface ResourceParams {
  id: string;
}

export const resourceController: CRUDController<ResourceBody, ResourceParams> & {
  getResourceWithContents: (req: FastifyRequest<{ Params: ResourceParams }>, reply: FastifyReply) => Promise<any>;
  getResourceWithPublications: (req: FastifyRequest<{ Params: ResourceParams }>, reply: FastifyReply) => Promise<any>;
} = {
  create: async (req, reply) => {
    const resource = await prisma.resource.create({ data: req.body });
    reply.code(201).send(resource);
  },

  readAll: async (_req, reply) => {
    const resources = await prisma.resource.findMany();
    reply.send(resources);
  },

  readOne: async (req, reply) => {
    const { id } = req.params;
    const resource = await prisma.resource.findUnique({ where: { resourceId: id } });
    reply.send(resource ?? { error: "Not found" });
  },

  update: async (req, reply) => {
    const { id } = req.params;
    const updated = await prisma.resource.update({ where: { resourceId: id }, data: req.body });
    reply.send(updated);
  },

  delete: async (req, reply) => {
    const { id } = req.params;
    await prisma.resource.delete({ where: { resourceId: id } });
    reply.send({ success: true });
  },

  // Routes avancées
  getResourceWithContents: async (req, reply) => {
    const { id } = req.params;
    const resource = await prisma.resource.findUnique({
      where: { resourceId: id },
      include: { contents: { include: { content: true } } },
    });
    reply.send(resource ?? { error: "Not found" });
  },

  getResourceWithPublications: async (req, reply) => {
    const { id } = req.params;
    const resource = await prisma.resource.findUnique({
      where: { resourceId: id },
      include: { publications: { include: { publication: true } } },
    });
    reply.send(resource ?? { error: "Not found" });
  },

  advancedRoutes: (path: string, fastify: FastifyInstance) => {
    fastify.get(`${path}/:id/contents`, resourceController.getResourceWithContents);
    fastify.get(`${path}/:id/publications`, resourceController.getResourceWithPublications);
  },
};
