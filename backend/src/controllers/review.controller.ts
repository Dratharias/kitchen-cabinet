import { FastifyRequest, FastifyReply } from "fastify";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export class ReviewController {
  /**
   * Get all reviews for a publication
   */
  async getByPublication(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { publicationId } = request.params as { publicationId: string };

      const reviews = await prisma.review.findMany({
        where: { publication_id: publicationId },
        orderBy: { date_review: "desc" },
      });

      return reply.send({
        success: true,
        data: reviews,
      });
    } catch (error: any) {
      console.error("Get reviews error:", error);
      return reply.code(500).send({
        success: false,
        error: "Failed to fetch reviews",
      });
    }
  }

  /**
   * Create a new review
   */
  async create(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { publication_id, rating, comment, description } = request.body as {
        publication_id: string;
        rating?: number | null;
        comment?: string[];
        description?: string[];
      };

      // Validation
      if (!publication_id) {
        return reply.code(400).send({
          success: false,
          error: "publication_id is required",
        });
      }

      // Verify publication exists
      const publication = await prisma.publication.findUnique({
        where: { publication_id },
      });

      if (!publication) {
        return reply.code(404).send({
          success: false,
          error: "Publication not found",
        });
      }

      // Create review
      const review = await prisma.review.create({
        data: {
          publication_id,
          rating: rating || null,
          comment: comment || [],
          description: description || [],
        },
      });

      return reply.send({
        success: true,
        data: review,
      });
    } catch (error: any) {
      console.error("Create review error:", error);
      return reply.code(500).send({
        success: false,
        error: "Failed to create review",
      });
    }
  }

  /**
   * Update a review
   */
  async update(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string };
      const { rating, comment, description } = request.body as {
        rating?: number | null;
        comment?: string[];
        description?: string[];
      };

      const updates: any = {};
      if (rating !== undefined) updates.rating = rating;
      if (comment !== undefined) updates.comment = comment;
      if (description !== undefined) updates.description = description;

      const review = await prisma.review.update({
        where: { review_id: id },
        data: updates,
      });

      return reply.send({
        success: true,
        data: review,
      });
    } catch (error: any) {
      console.error("Update review error:", error);

      if (error.code === "P2025") {
        return reply.code(404).send({
          success: false,
          error: "Review not found",
        });
      }

      return reply.code(500).send({
        success: false,
        error: "Failed to update review",
      });
    }
  }

  /**
   * Delete a review
   */
  async delete(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string };

      await prisma.review.delete({
        where: { review_id: id },
      });

      return reply.send({
        success: true,
        data: { review_id: id },
      });
    } catch (error: any) {
      console.error("Delete review error:", error);

      if (error.code === "P2025") {
        return reply.code(404).send({
          success: false,
          error: "Review not found",
        });
      }

      return reply.code(500).send({
        success: false,
        error: "Failed to delete review",
      });
    }
  }
}
