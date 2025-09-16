import { PrismaClient } from "@prisma/client";

export async function deleteNestedResources(prisma: PrismaClient, publicationId: string | null, deletePayload: Record<string, any>) {
  const operations: any[] = [];

  // 1) Delete reviews by ID
  if (Array.isArray(deletePayload.reviewIds) && deletePayload.reviewIds.length) {
    operations.push(
      prisma.review.deleteMany({
        where: { review_id: { in: deletePayload.reviewIds } }
      })
    );
  }

  if (Array.isArray(deletePayload.productReviewIds) && deletePayload.productReviewIds.length) {
    operations.push(
      prisma.review.deleteMany({
        where: { review_id: { in: deletePayload.productReviewIds } }
      })
    );
  }

  // 2) Delete junction table records by composite keys
  if (Array.isArray(deletePayload.contentIngredientPairs) && deletePayload.contentIngredientPairs.length) {
    for (const pair of deletePayload.contentIngredientPairs) {
      operations.push(
        prisma.content_ingredient.delete({
          where: {
            content_id_ingredient_id: {
              content_id: pair.contentId,
              ingredient_id: pair.ingredientId
            }
          }
        })
      );
    }
  }

  if (Array.isArray(deletePayload.contentPrepTimePairs) && deletePayload.contentPrepTimePairs.length) {
    for (const pair of deletePayload.contentPrepTimePairs) {
      operations.push(
        prisma.content_prep_time.delete({
          where: {
            content_id_prep_time_id: {
              content_id: pair.contentId,
              prep_time_id: pair.prepTimeId
            }
          }
        })
      );
    }
  }

  if (Array.isArray(deletePayload.contentSegmentPairs) && deletePayload.contentSegmentPairs.length) {
    for (const pair of deletePayload.contentSegmentPairs) {
      operations.push(
        prisma.content_segment.delete({
          where: {
            content_id_segment_id: {
              content_id: pair.contentId,
              segment_id: pair.segmentId
            }
          }
        })
      );
    }
  }

  if (Array.isArray(deletePayload.ingredientUnitPairs) && deletePayload.ingredientUnitPairs.length) {
    for (const pair of deletePayload.ingredientUnitPairs) {
      operations.push(
        prisma.ingredient_unit.delete({
          where: {
            ingredient_id_unit_id: {
              ingredient_id: pair.ingredientId,
              unit_id: pair.unitId
            }
          }
        })
      );
    }
  }

  if (Array.isArray(deletePayload.productCategoryPairs) && deletePayload.productCategoryPairs.length) {
    for (const pair of deletePayload.productCategoryPairs) {
      operations.push(
        prisma.product_category.delete({
          where: {
            product_id_category_id: {
              product_id: pair.productId,
              category_id: pair.categoryId
            }
          }
        })
      );
    }
  }

  if (Array.isArray(deletePayload.publicationTagPairs) && deletePayload.publicationTagPairs.length) {
    for (const pair of deletePayload.publicationTagPairs) {
      operations.push(
        prisma.publication_tag.delete({
          where: {
            publication_id_category_id: {
              publication_id: pair.publicationId,
              category_id: pair.categoryId
            }
          }
        })
      );
    }
  }

  if (Array.isArray(deletePayload.segmentPrepTimePairs) && deletePayload.segmentPrepTimePairs.length) {
    for (const pair of deletePayload.segmentPrepTimePairs) {
      operations.push(
        prisma.segment_prep_time.delete({
          where: {
            segment_id_prep_time_id: {
              segment_id: pair.segmentId,
              prep_time_id: pair.prepTimeId
            }
          }
        })
      );
    }
  }

  // 3) Delete main entities by IDs (cascading will handle related junction records)
  if (Array.isArray(deletePayload.ingredientIds) && deletePayload.ingredientIds.length) {
    operations.push(
      prisma.ingredient.deleteMany({
        where: { ingredient_id: { in: deletePayload.ingredientIds } }
      })
    );
  }

  if (Array.isArray(deletePayload.segmentIds) && deletePayload.segmentIds.length) {
    operations.push(
      prisma.segment.deleteMany({
        where: { segment_id: { in: deletePayload.segmentIds } }
      })
    );
  }

  if (Array.isArray(deletePayload.contentIds) && deletePayload.contentIds.length) {
    operations.push(
      prisma.content.deleteMany({
        where: { content_id: { in: deletePayload.contentIds } }
      })
    );
  }

  if (Array.isArray(deletePayload.productIds) && deletePayload.productIds.length) {
    operations.push(
      prisma.product.deleteMany({
        where: { product_id: { in: deletePayload.productIds } }
      })
    );
  }

  // 4) Handle macros (nullify references first, then delete)
  if (Array.isArray(deletePayload.macroIds) && deletePayload.macroIds.length) {
    operations.push(
      prisma.product.updateMany({
        where: { macro_id: { in: deletePayload.macroIds } },
        data: { macro_id: null }
      })
    );
    operations.push(
      prisma.macro.deleteMany({
        where: { macro_id: { in: deletePayload.macroIds } }
      })
    );
  }

  // 5) Delete shared entities (be cautious - these may be referenced elsewhere)
  if (Array.isArray(deletePayload.unitIds) && deletePayload.unitIds.length) {
    operations.push(
      prisma.unit.deleteMany({
        where: { unit_id: { in: deletePayload.unitIds } }
      })
    );
  }

  if (Array.isArray(deletePayload.prepTimeIds) && deletePayload.prepTimeIds.length) {
    operations.push(
      prisma.prep_time.deleteMany({
        where: { prep_time_id: { in: deletePayload.prepTimeIds } }
      })
    );
  }

  if (Array.isArray(deletePayload.categoryIds) && deletePayload.categoryIds.length) {
    operations.push(
      prisma.category.deleteMany({
        where: { category_id: { in: deletePayload.categoryIds } }
      })
    );
  }

  // 6) Delete publication last if requested
  if (deletePayload.deletePublication === true && publicationId) {
    operations.push(
      prisma.publication.delete({
        where: { publication_id: publicationId }
      })
    );
  }

  if (operations.length === 0) {
    return { success: true, resultsCount: 0, results: [] };
  }

  try {
    const results = await prisma.$transaction(operations);
    return { 
      success: true, 
      resultsCount: results.length, 
      results 
    };
  } catch (error) {
    throw error;
  }
}