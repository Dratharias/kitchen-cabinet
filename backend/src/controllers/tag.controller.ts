import { FastifyRequest, FastifyReply } from "fastify";
import { PrismaClient } from "@prisma/client";
import { slugify } from "../lib/utils.js";

const prisma = new PrismaClient();

export class TagController {
  async getAll(request: FastifyRequest, reply: FastifyReply) {
    try {
      const tags = await prisma.tag.findMany({
        orderBy: { name: "asc" },
        include: {
          _count: {
            select: { publication_tags: true },
          },
        },
      });

      return reply.send({
        success: true,
        data: tags,
      });
    } catch (error: any) {
      console.error("Get tags error:", error);
      return reply.code(500).send({
        success: false,
        error: "Failed to fetch tags",
      });
    }
  }

  async create(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { name, description } = request.body as any;

      if (!name) {
        return reply.code(400).send({
          success: false,
          error: "Name is required",
        });
      }

      const slug = slugify(name);

      const tag = await prisma.tag.create({
        data: {
          name,
          slug,
          description: description || null,
        },
      });

      return reply.send({
        success: true,
        data: tag,
      });
    } catch (error: any) {
      console.error("Create tag error:", error);

      if (error.code === "P2002") {
        return reply.code(400).send({
          success: false,
          error: "Tag with this name already exists",
        });
      }

      return reply.code(500).send({
        success: false,
        error: "Failed to create tag",
      });
    }
  }

  async update(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string };
      const { name, description } = request.body as any;

      const updates: any = {};
      if (name) {
        updates.name = name;
        updates.slug = slugify(name);
      }
      if (description !== undefined) {
        updates.description = description;
      }

      const tag = await prisma.tag.update({
        where: { tag_id: id },
        data: updates,
      });

      return reply.send({
        success: true,
        data: tag,
      });
    } catch (error: any) {
      console.error("Update tag error:", error);
      return reply.code(500).send({
        success: false,
        error: "Failed to update tag",
      });
    }
  }

  async delete(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string };

      await prisma.tag.delete({
        where: { tag_id: id },
      });

      return reply.send({
        success: true,
        data: { tag_id: id },
      });
    } catch (error: any) {
      console.error("Delete tag error:", error);
      return reply.code(500).send({
        success: false,
        error: "Failed to delete tag",
      });
    }
  }
}
