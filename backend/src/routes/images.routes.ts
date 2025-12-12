import { FastifyInstance } from "fastify";
import { ImagesController } from "../controllers/images.controller.js";

export async function imagesRoutes(fastify: FastifyInstance) {
  const controller = new ImagesController();

  // List all images
  fastify.get("/images", controller.listImages.bind(controller));

  // Get specific image info
  fastify.get("/images/:filename", controller.getImageInfo.bind(controller));
}
