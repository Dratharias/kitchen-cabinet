import { FastifyRequest, FastifyReply } from "fastify";
import { PrismaClient } from "@prisma/client";
import { safeId, assert, slugify } from "../lib/utils.js";
import type {
  OrchestratorRequest,
  PublicationPayload,
  TagPayload,
  ProductPayload,
  UnitPayload,
  ContentPayload,
  IngredientPayload,
  SegmentWithPosition,
} from "../types/index.js";

const prisma = new PrismaClient();

export class OrchestratorController {
  async handle(
    request: FastifyRequest<{ Body: OrchestratorRequest }>,
    reply: FastifyReply
  ) {
    try {
      const { action, payload } = request.body;

      if (!action || !payload) {
        return reply.code(400).send({
          success: false,
          error: "Action and payload are required",
        });
      }

      const results: Record<string, any> = {};
      const errors: Record<string, string> = {};

      for (const [key, pubPayload] of Object.entries(payload)) {
        try {
          if (action === "create") {
            assert(pubPayload, "Publication payload is required", "create");
            results[key] = await this.createPublication(pubPayload);
          } else if (action === "update") {
            assert(pubPayload, "Publication payload is required", "update");
            assert(
              pubPayload.publication_id,
              "publication_id is required for update",
              "update"
            );
            results[key] = await this.updatePublication(pubPayload);
          } else if (action === "delete") {
            await prisma.publication.delete({
              where: { publication_id: key },
            });
            results[key] = { deleted: true, publication_id: key };
          }
        } catch (error: any) {
          errors[key] = error.message;
        }
      }

      if (Object.keys(errors).length > 0) {
        return reply.code(400).send({
          success: false,
          results,
          errors,
        });
      }

      return reply.send({
        success: true,
        results,
      });
    } catch (error: any) {
      console.error("Orchestrator error:", error);
      return reply.code(500).send({
        success: false,
        error: error.message || "Internal server error",
      });
    }
  }

  private async createPublication(pub: PublicationPayload) {
    return await prisma.$transaction(async (tx) => {
      // Generate publication ID
      const publication_id = await safeId(
        tx as any,
        "publication",
        "publication_id",
        pub.publication_id
      );

      // Create publication
      const publication = await tx.publication.create({
        data: {
          publication_id,
          title: pub.title,
          description: pub.description || [],
          note: pub.note || [],
          public: pub.public ?? true,
          published: pub.published ?? true,
          thumbnail: pub.thumbnail || null,
        },
      });

      // Handle tags
      if (pub.tags && pub.tags.length > 0) {
        for (const tagPayload of pub.tags) {
          const tag = await this.upsertTag(tx, tagPayload);
          await tx.publication_tag.create({
            data: {
              publication_id: publication.publication_id,
              tag_id: tag.tag_id,
            },
          });
        }
      }

      // Handle contents
      if (pub.contents && pub.contents.length > 0) {
        for (const contentPayload of pub.contents) {
          await this.createContent(tx, publication.publication_id, contentPayload);
        }
      }

      return publication;
    });
  }

  private async updatePublication(pub: PublicationPayload) {
    return await prisma.$transaction(async (tx) => {
      const publication_id = pub.publication_id!;

      // Update publication fields
      await tx.publication.update({
        where: { publication_id },
        data: {
          title: pub.title,
          description: pub.description || [],
          note: pub.note || [],
          public: pub.public ?? true,
          published: pub.published ?? true,
          thumbnail: pub.thumbnail || null,
        },
      });

      // Delete and recreate tags
      await tx.publication_tag.deleteMany({
        where: { publication_id },
      });

      if (pub.tags && pub.tags.length > 0) {
        for (const tagPayload of pub.tags) {
          const tag = await this.upsertTag(tx, tagPayload);
          await tx.publication_tag.create({
            data: {
              publication_id,
              tag_id: tag.tag_id,
            },
          });
        }
      }

      // Delete and recreate contents
      const existingContents = await tx.content.findMany({
        where: { publication_id },
        select: { content_id: true },
      });

      if (existingContents.length > 0) {
        const contentIds = existingContents.map((c) => c.content_id);

        // Delete junction tables first
        await tx.content_segment.deleteMany({
          where: { content_id: { in: contentIds } },
        });
        await tx.content_ingredient.deleteMany({
          where: { content_id: { in: contentIds } },
        });

        // Delete contents
        await tx.content.deleteMany({
          where: { publication_id },
        });
      }

      // Recreate contents
      if (pub.contents && pub.contents.length > 0) {
        for (const contentPayload of pub.contents) {
          await this.createContent(tx, publication_id, contentPayload);
        }
      }

      return { publication_id };
    });
  }

  private async upsertTag(tx: any, tagPayload: TagPayload) {
    // Try to find existing tag by name
    let tag = await tx.tag.findUnique({
      where: { name: tagPayload.name },
    });

    if (!tag) {
      // Create new tag
      const slug = tagPayload.slug || slugify(tagPayload.name);
      tag = await tx.tag.create({
        data: {
          name: tagPayload.name,
          slug,
          description: tagPayload.description || null,
        },
      });
    }

    return tag;
  }

  private async upsertProduct(tx: any, productPayload: ProductPayload) {
    // Try to find existing product by name
    let product = await tx.product.findUnique({
      where: { name: productPayload.name },
    });

    if (!product) {
      // Create new product
      product = await tx.product.create({
        data: {
          name: productPayload.name,
          description: productPayload.description || null,
        },
      });
    }

    return product;
  }

  private async upsertUnit(tx: any, unitPayload: UnitPayload) {
    // Try to find existing unit by name
    let unit = await tx.unit.findUnique({
      where: { name: unitPayload.name },
    });

    if (!unit) {
      // Create new unit
      unit = await tx.unit.create({
        data: {
          name: unitPayload.name,
        },
      });
    }

    return unit;
  }

  private async createContent(
    tx: any,
    publication_id: string,
    contentPayload: ContentPayload
  ) {
    // Create content
    const content = await tx.content.create({
      data: {
        publication_id,
        subtitle: contentPayload.subtitle || null,
        thumbnail: contentPayload.thumbnail || null,
        note: contentPayload.note || null,
        total_prep_time: contentPayload.total_prep_time,
        prep_time_note: contentPayload.prep_time_note || null,
        serving_yield: contentPayload.serving_yield || null,
        serving_value: contentPayload.serving_value || null,
        gallery: contentPayload.gallery || [],
      },
    });

    // Handle segments
    if (contentPayload.segments && contentPayload.segments.length > 0) {
      for (let i = 0; i < contentPayload.segments.length; i++) {
        const segmentWithPos = contentPayload.segments[i];
        const segment = await tx.segment.create({
          data: {
            title: segmentWithPos.segment.title || null,
            paragraph: segmentWithPos.segment.paragraph,
            note: segmentWithPos.segment.note || null,
            section: segmentWithPos.segment.section || null,
          },
        });

        await tx.content_segment.create({
          data: {
            content_id: content.content_id,
            segment_id: segment.segment_id,
            position: segmentWithPos.position ?? i + 1,
          },
        });
      }
    }

    // Handle ingredients
    if (contentPayload.ingredients && contentPayload.ingredients.length > 0) {
      for (const ingredientPayload of contentPayload.ingredients) {
        // Upsert product
        const product = ingredientPayload.product
          ? await this.upsertProduct(tx, ingredientPayload.product)
          : await tx.product.findUnique({
              where: { product_id: ingredientPayload.product_id },
            });

        assert(product, "Product is required for ingredient", "createContent");

        // Upsert unit if provided
        let unit_id = ingredientPayload.unit_id || null;
        if (ingredientPayload.unit) {
          const unit = await this.upsertUnit(tx, ingredientPayload.unit);
          unit_id = unit.unit_id;
        }

        // Create ingredient
        const ingredient = await tx.ingredient.create({
          data: {
            product_id: product.product_id,
            quantity: ingredientPayload.quantity || null,
            unit_id,
            cut: ingredientPayload.cut || null,
            title: ingredientPayload.title || null,
            note: ingredientPayload.note || null,
            multiply_factor: ingredientPayload.multiply_factor || 1.0,
            section: ingredientPayload.section || null,
          },
        });

        // Link to content
        await tx.content_ingredient.create({
          data: {
            content_id: content.content_id,
            ingredient_id: ingredient.ingredient_id,
          },
        });
      }
    }

    return content;
  }
}
