import { FastifyRequest, FastifyReply } from "fastify";
import { PrismaClient } from "@prisma/client";
import {
  parsePagination,
  parseSort,
  buildPaginationResponse,
} from "../lib/utils.js";
import type { PublicationFilter } from "../types/index.js";

const prisma = new PrismaClient();

export class PublicationController {
  /**
   * Get all publications (public endpoint - filtered)
   */
  async getPublicPublications(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { page, limit, skip, take } = parsePagination(request.query);
      const { sortBy, order } = parseSort(request.query, "date_created");
      const filter = (request.query as any).filter
        ? JSON.parse((request.query as any).filter)
        : {};

      // Build where clause - only public and published
      const where: any = {
        public: true,
        published: true,
      };

      // Add search query
      if (filter.q) {
        where.OR = [
          { title: { contains: filter.q, mode: "insensitive" } },
          { description: { has: filter.q } },
        ];
      }

      // Add tag filter
      if (filter.tagIds && filter.tagIds.length > 0) {
        where.tags = {
          some: {
            tag_id: { in: filter.tagIds },
          },
        };
      }

      // Get total count
      const total = await prisma.publication.count({ where });

      // Get publications
      const publications = await prisma.publication.findMany({
        where,
        skip,
        take,
        orderBy: { [sortBy]: order },
        include: {
          tags: {
            include: {
              tag: true,
            },
          },
          contents: {
            include: {
              content_segments: {
                include: {
                  segment: true,
                },
                orderBy: {
                  position: "asc",
                },
              },
              content_ingredients: {
                include: {
                  ingredient: {
                    include: {
                      product: true,
                      unit: true,
                    },
                  },
                },
              },
            },
          },
          reviews: {
            select: {
              rating: true,
            },
          },
        },
      });

      // Calculate review stats
      const publicationsWithStats = publications.map((pub) => {
        const ratings = pub.reviews
          .map((r) => r.rating)
          .filter((r): r is number => r !== null);
        const averageRating =
          ratings.length > 0
            ? ratings.reduce((a, b) => a + b, 0) / ratings.length
            : 0;

        return {
          ...pub,
          reviewCount: ratings.length,
          averageRating: Math.round(averageRating * 10) / 10,
        };
      });

      return reply.send({
        success: true,
        data: publicationsWithStats,
        pagination: buildPaginationResponse(total, page, limit),
      });
    } catch (error: any) {
      console.error("Get public publications error:", error);
      return reply.code(500).send({
        success: false,
        error: "Failed to fetch publications",
      });
    }
  }

  /**
   * Get single publication by ID (public endpoint - filtered)
   */
  async getPublicPublication(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string };

      const publication = await prisma.publication.findFirst({
        where: {
          publication_id: id,
          public: true,
          published: true,
        },
        include: {
          tags: {
            include: {
              tag: true,
            },
          },
          contents: {
            include: {
              content_segments: {
                include: {
                  segment: true,
                },
                orderBy: {
                  position: "asc",
                },
              },
              content_ingredients: {
                include: {
                  ingredient: {
                    include: {
                      product: true,
                      unit: true,
                    },
                  },
                },
              },
            },
          },
          reviews: true,
        },
      });

      if (!publication) {
        return reply.code(404).send({
          success: false,
          error: "Publication not found",
        });
      }

      // Calculate review stats
      const ratings = publication.reviews
        .map((r) => r.rating)
        .filter((r): r is number => r !== null);
      const averageRating =
        ratings.length > 0
          ? ratings.reduce((a, b) => a + b, 0) / ratings.length
          : 0;

      const result = {
        ...publication,
        reviewCount: ratings.length,
        averageRating: Math.round(averageRating * 10) / 10,
      };

      return reply.send({
        success: true,
        data: result,
      });
    } catch (error: any) {
      console.error("Get public publication error:", error);
      return reply.code(500).send({
        success: false,
        error: "Failed to fetch publication",
      });
    }
  }

  /**
   * Get all publications (private endpoint - no filter)
   */
  async getAllPublications(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { page, limit, skip, take } = parsePagination(request.query);
      const { sortBy, order } = parseSort(request.query, "date_created");
      const filter = (request.query as any).filter
        ? JSON.parse((request.query as any).filter)
        : {};

      // Build where clause - no restrictions
      const where: any = {};

      // Add search query
      if (filter.q) {
        where.OR = [
          { title: { contains: filter.q, mode: "insensitive" } },
          { description: { has: filter.q } },
        ];
      }

      // Add published filter
      if (typeof filter.published === "boolean") {
        where.published = filter.published;
      }

      // Add public filter
      if (typeof filter.public === "boolean") {
        where.public = filter.public;
      }

      // Add tag filter
      if (filter.tagIds && filter.tagIds.length > 0) {
        where.tags = {
          some: {
            tag_id: { in: filter.tagIds },
          },
        };
      }

      // Get total count
      const total = await prisma.publication.count({ where });

      // Get publications
      const publications = await prisma.publication.findMany({
        where,
        skip,
        take,
        orderBy: { [sortBy]: order },
        include: {
          tags: {
            include: {
              tag: true,
            },
          },
          contents: {
            include: {
              content_segments: {
                include: {
                  segment: true,
                },
                orderBy: {
                  position: "asc",
                },
              },
              content_ingredients: {
                include: {
                  ingredient: {
                    include: {
                      product: true,
                      unit: true,
                    },
                  },
                },
              },
            },
          },
          reviews: {
            select: {
              rating: true,
            },
          },
        },
      });

      // Calculate review stats
      const publicationsWithStats = publications.map((pub) => {
        const ratings = pub.reviews
          .map((r) => r.rating)
          .filter((r): r is number => r !== null);
        const averageRating =
          ratings.length > 0
            ? ratings.reduce((a, b) => a + b, 0) / ratings.length
            : 0;

        return {
          ...pub,
          reviewCount: ratings.length,
          averageRating: Math.round(averageRating * 10) / 10,
        };
      });

      return reply.send({
        success: true,
        data: publicationsWithStats,
        pagination: buildPaginationResponse(total, page, limit),
      });
    } catch (error: any) {
      console.error("Get all publications error:", error);
      return reply.code(500).send({
        success: false,
        error: "Failed to fetch publications",
      });
    }
  }

  /**
   * Get single publication by ID (private endpoint - no filter)
   */
  async getPublication(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string };

      const publication = await prisma.publication.findUnique({
        where: {
          publication_id: id,
        },
        include: {
          tags: {
            include: {
              tag: true,
            },
          },
          contents: {
            include: {
              content_segments: {
                include: {
                  segment: true,
                },
                orderBy: {
                  position: "asc",
                },
              },
              content_ingredients: {
                include: {
                  ingredient: {
                    include: {
                      product: true,
                      unit: true,
                    },
                  },
                },
              },
            },
          },
          reviews: true,
        },
      });

      if (!publication) {
        return reply.code(404).send({
          success: false,
          error: "Publication not found",
        });
      }

      // Calculate review stats
      const ratings = publication.reviews
        .map((r) => r.rating)
        .filter((r): r is number => r !== null);
      const averageRating =
        ratings.length > 0
          ? ratings.reduce((a, b) => a + b, 0) / ratings.length
          : 0;

      const result = {
        ...publication,
        reviewCount: ratings.length,
        averageRating: Math.round(averageRating * 10) / 10,
      };

      return reply.send({
        success: true,
        data: result,
      });
    } catch (error: any) {
      console.error("Get publication error:", error);
      return reply.code(500).send({
        success: false,
        error: "Failed to fetch publication",
      });
    }
  }

  /**
   * Delete publication
   */
  async deletePublication(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string };

      // Check if exists
      const existing = await prisma.publication.findUnique({
        where: { publication_id: id },
      });

      if (!existing) {
        return reply.code(404).send({
          success: false,
          error: "Publication not found",
        });
      }

      // Delete (cascades will handle relations)
      await prisma.publication.delete({
        where: { publication_id: id },
      });

      return reply.send({
        success: true,
        data: { publication_id: id },
      });
    } catch (error: any) {
      console.error("Delete publication error:", error);
      return reply.code(500).send({
        success: false,
        error: "Failed to delete publication",
      });
    }
  }
}
