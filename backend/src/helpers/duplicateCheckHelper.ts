import { PrismaClient } from "@prisma/client";

type AnyObj = Record<string, any>;

export class DuplicateCheckHelper {
  constructor(private prisma: PrismaClient) {}

  async findOrCreateProduct(productData: AnyObj): Promise<string> {
    if (productData.productId) {
      return productData.productId;
    }

    const existing = await this.prisma.product.findFirst({
      where: { name: productData.name },
      select: { product_id: true }
    });

    if (existing) {
      return existing.product_id;
    }

    return productData.name; // Will be handled by create logic
  }

  async findOrCreatePrepTime(prepTimeData: AnyObj): Promise<string | null> {
    if (prepTimeData.prepTimeId) {
      return prepTimeData.prepTimeId;
    }

    const whereClause: any = { duration: prepTimeData.duration ?? 0 };
    if (prepTimeData.categoryId) {
      whereClause.style_id = prepTimeData.categoryId;
    }

    const existing = await this.prisma.prep_time.findFirst({
      where: whereClause,
      select: { prep_time_id: true }
    });

    if (existing) {
      return existing.prep_time_id;
    }

    return null; // Will be handled by create logic
  }

  async findOrCreateSegment(segmentData: AnyObj): Promise<string | null> {
    if (segmentData.segmentId) {
      return segmentData.segmentId;
    }

    const existing = await this.prisma.segment.findUnique({
      where: { paragraph: segmentData.paragraph },
      select: { segment_id: true }
    });

    if (existing) {
      return existing.segment_id;
    }

    return null; // Will be handled by create logic
  }

  async preprocessPublicationData(body: AnyObj): Promise<AnyObj> {
    const processedBody = { ...body };

    // Process products in ingredients
    if (processedBody.contents) {
      for (const content of processedBody.contents) {
        if (content.contentIngredients) {
          for (const ingredient of content.contentIngredients) {
            if (ingredient.product && !ingredient.product.productId) {
              const existingProductId = await this.findOrCreateProduct(ingredient.product);
              if (existingProductId !== ingredient.product.name) {
                ingredient.product.productId = existingProductId;
              }
            }
          }
        }

        // Process prep times
        if (content.contentPrepTimes) {
          for (const prepTime of content.contentPrepTimes) {
            const existingPrepTimeId = await this.findOrCreatePrepTime(prepTime);
            if (existingPrepTimeId) {
              prepTime.prepTimeId = existingPrepTimeId;
            }
          }
        }

        // Process segments
        if (content.contentSegments) {
          for (const segment of content.contentSegments) {
            const existingSegmentId = await this.findOrCreateSegment(segment);
            if (existingSegmentId) {
              segment.segmentId = existingSegmentId;
            }

            // Process segment prep times
            if (segment.prepTimes) {
              for (const prepTime of segment.prepTimes) {
                const existingPrepTimeId = await this.findOrCreatePrepTime(prepTime);
                if (existingPrepTimeId) {
                  prepTime.prepTimeId = existingPrepTimeId;
                }
              }
            }
          }
        }
      }
    }

    // Process ingredient references
    if (processedBody.ingredientsRef) {
      for (const ingredient of processedBody.ingredientsRef) {
        if (ingredient.product && !ingredient.product.productId) {
          const existingProductId = await this.findOrCreateProduct(ingredient.product);
          if (existingProductId !== ingredient.product.name) {
            ingredient.product.productId = existingProductId;
          }
        }
      }
    }

    return processedBody;
  }
}