import { Product, Publication, Review } from "types/controller.types.js";
import { ReviewCreateDto, ReviewReadAllDto, ReviewUpdateDto } from "types/dto.types.js";
import { v4 as uuidv4 } from "uuid";
import { PaginatedResponse } from "types/db.types.js";
import { GenericPaginatedController } from "types/crud.types.js";
import { prisma } from "../../config.js";

export const normalizeReview = (review: any): Review => ({
  review_id: review.review_id,
  product_id: review.product_id,
  publication_id: review.publication_id,
  rating: review.rating,
  comment: review.comment,
  description: review.description,
  buy_again: review.buy_again ?? null,
  date_review: review.date_review,

  // Only include product or publication if they exist
  product: review.product ?? null,
  publication: review.publication ?? null,
});

export class ReviewController implements GenericPaginatedController<
  Review,
  Omit<Review, "product" | "publication">,
  { product: Product | null; publication: Publication | null }
> {

  async create(payload: Omit<Review, "product" | "publication"> & { connect?: ReviewCreateDto["connect"] }): Promise<Review> {
    const newId = uuidv4();
    const review = await prisma.review.create({
      data: {
        review_id: newId,
        rating: payload.rating,
        comment: payload.comment,
        description: payload.description,
        buy_again: payload.buy_again,
        date_review: payload.date_review,
        product_id: payload.connect?.product?.[0]?.product_id ?? payload.product_id ?? undefined,
        publication_id: payload.connect?.publication?.[0]?.publication_id ?? payload.publication_id ?? undefined,
      },
      include: {
        product: {
          include: {
            macro: true,
            product_categories: {
              include: {
                category: true,
              },
            },
          },
        },
        publication: true,
      },
    });
    return normalizeReview(review);
  }

  async findById(id: string): Promise<Review | null> {
    const review = await prisma.review.findUnique({
      where: { review_id: id },
      include: {
        product: {
          include: {
            macro: true,
            product_categories: {
              include: {
                category: true,
              },
            },
          },
        },
        publication: true,
      },
    });
    return review ? normalizeReview(review) : null;
  }

  async findAll(params?: ReviewReadAllDto): Promise<PaginatedResponse<Review>> {
    const where: any = {};

    if (params?.filter) {
      const { publicationId, productId, ...directFields } = params.filter;
      Object.assign(where, directFields);

      if (publicationId) where.publication_id = publicationId;
      if (productId) where.product_id = productId;
    }

    // Count total items for pagination
    const total = await prisma.review.count({ where });

    // Valeurs par défaut pour la pagination
    const limit = params?.take ? Number(params.take) : 12;
    const skip = params?.skip ? Number(params.skip) : 0;

    // Fetch items with skip/take
    const reviews = await prisma.review.findMany({
      where,
      include: {
        product: {
          include: {
            macro: true,
            product_categories: {
              include: {
                category: true,
              },
            },
          },
        },
        publication: true,
      },
      skip,
      take: limit,
    });

    const items = reviews.map(normalizeReview);

    const page = Math.floor(skip / limit) + 1;
    const totalPages = Math.ceil(total / limit);

    return { items, total, page, limit, totalPages };
  }

  async update(id: string, payload: ReviewUpdateDto): Promise<Review> {
    const review = await prisma.review.update({
      where: { review_id: id },
      data: {
        rating: payload.rating,
        comment: payload.comment,
        description: payload.description,
        buy_again: payload.buy_again,
        date_review: payload.date_review,
        product_id: payload.connect?.product?.[0]?.product_id ?? payload.set?.product?.[0]?.product_id ?? payload.product_id ?? undefined,
        publication_id: payload.connect?.publication?.[0]?.publication_id ?? payload.set?.publication?.[0]?.publication_id ?? payload.publication_id ?? undefined,
      },
      include: {
        product: {
          include: {
            macro: true,
            product_categories: {
              include: {
                category: true,
              },
            },
          },
        },
        publication: true,
      },
    });
    return normalizeReview(review);
  }

  async delete(id: string): Promise<{ deleted: boolean }> {
    await prisma.review.delete({ where: { review_id: id } });
    return { deleted: true };
  }
}