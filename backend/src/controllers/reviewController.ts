import { FastifyRequest, FastifyReply, FastifyInstance } from "fastify";
import { PrismaClient } from "@prisma/client";
import { CRUDController } from "./crudController";

const prisma = new PrismaClient();

interface ReviewBody {
  productId: string;
  publicationId: string;
  rating?: number;
  comment?: string[];
  description?: string[];
  buyAgain?: string;
  dateReview?: Date;
}

interface ReviewParams {
  id: string;
}

export const reviewController: CRUDController<ReviewBody, ReviewParams> & {
  getReviewsByProduct: (req: FastifyRequest<{ Params: ReviewParams }>, reply: FastifyReply) => Promise<any>;
  getReviewsByPublication: (req: FastifyRequest<{ Params: ReviewParams }>, reply: FastifyReply) => Promise<any>;
} = {
  create: async (req, reply) => {
    const review = await prisma.review.create({ data: req.body });
    reply.code(201).send(review);
  },

  readAll: async (_req, reply) => {
    const reviews = await prisma.review.findMany();
    reply.send(reviews);
  },

  readOne: async (req, reply) => {
    const { id } = req.params;
    const review = await prisma.review.findUnique({ where: { reviewId: id } });
    reply.send(review ?? { error: "Not found" });
  },

  update: async (req, reply) => {
    const { id } = req.params;
    const updated = await prisma.review.update({ where: { reviewId: id }, data: req.body });
    reply.send(updated);
  },

  delete: async (req, reply) => {
    const { id } = req.params;
    await prisma.review.delete({ where: { reviewId: id } });
    reply.send({ success: true });
  },

  getReviewsByProduct: async (req, reply) => {
    const { id } = req.params;
    const reviews = await prisma.review.findMany({ where: { productId: id } });
    reply.send(reviews);
  },

  getReviewsByPublication: async (req, reply) => {
    const { id } = req.params;
    const reviews = await prisma.review.findMany({ where: { publicationId: id } });
    reply.send(reviews);
  },

  advancedRoutes: (path: string, fastify: FastifyInstance) => {
    fastify.get(`${path}/product/:id`, reviewController.getReviewsByProduct);
    fastify.get(`${path}/publication/:id`, reviewController.getReviewsByPublication);
  },
};
