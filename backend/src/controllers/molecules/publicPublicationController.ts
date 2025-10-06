import {
  Publication,
  PublicationTag,
  PublicPublication,
  Review,
} from "types/controller.types.js";
import { prisma } from "../../config.js";
import { PublicationReadAllDto } from "../../types/dto.types.js";
import { PublicationController } from "../organisms/publicationController.js";
import { shapePublicPublication } from "../../utils/shapePublication.js";

export const normalizePublication = (pub: any): PublicPublication => {
  const shaped = shapePublicPublication(pub);

  const reviewCount = shaped.reviews?.length ?? 0;
  const reviewAverageScore =
    reviewCount > 0
      ? shaped.reviews.reduce(
          (acc: number, r: Review) => acc + (r.rating ?? 0),
          0,
        ) / reviewCount
      : 0;

  return {
    publication_id: shaped.publication_id,
    title: shaped.title,
    description: shaped.description ?? [],
    note: shaped.note ?? [],
    thumbnail: shaped.thumbnail ?? null,
    gallery: shaped.gallery ?? [],
    type: shaped.type ?? null,
    style: shaped.style ?? null,
    author: shaped.author ?? null,
    contents: shaped.contents ?? null,
    productsRef: shaped.productsRef ?? null,
    reviewCount,
    reviewAverageScore,
    tags: shaped.tags?.map((t: PublicationTag) => t.category?.str_value) ?? [],
  };
};

export class PublicPublicationController extends PublicationController {
  async findAll(params?: PublicationReadAllDto) {
    const where: any = { public: true, published: true };

    if (params?.filter) {
      let filter = params.filter;

      if (typeof filter === "string") {
        try {
          filter = JSON.parse(filter);
        } catch (error) {
          console.error("Failed to parse filter:", error);
          filter = {};
        }
      }

      const { tagIds, contentIds, type, style, author, ...directFields } =
        filter as any;

      if (Array.isArray(type) && type.length) {
        where.type = { str_value: { in: type } };
      }
      if (Array.isArray(style) && style.length) {
        where.style = { str_value: { in: style } };
      }
      if (Array.isArray(author) && author.length) {
        where.author = { str_value: { in: author } };
      }

      Object.keys(directFields).forEach((key) => {
        const value = directFields[key as keyof typeof directFields];
        if (
          value !== undefined &&
          value !== null &&
          !Array.isArray(value) &&
          typeof value !== "object"
        ) {
          where[key] = value;
        }
      });

      if (tagIds?.length)
        where.tags = { some: { category_id: { in: tagIds } } };
      if (contentIds?.length)
        where.contents = { some: { content_id: { in: contentIds } } };
    }

    const total = await prisma.publication.count({ where });
    const limit = params?.take ? Number(params.take) : 12;
    const page = params?.page ? Number(params.page) : 1;
    const skip = (page - 1) * limit;

    const publications = await prisma.publication.findMany({
      where,
      include: this.buildPublicInclude(),
      skip,
      take: limit,
    });

    const items = publications.map(
      normalizePublication,
    ) as unknown as Publication[];
    const totalPages = Math.ceil(total / limit);

    return { items, total, page, limit, totalPages };
  }

  async findById(id: string) {
    const publication = await prisma.publication.findFirst({
      where: { publication_id: id, public: true, published: true },
      include: this.buildPublicInclude(),
    });

    return publication
      ? (normalizePublication(publication) as unknown as Publication)
      : null;
  }

  private buildPublicInclude(): any {
    return {
      type: true,
      style: true,
      author: true,
      contents: {
        include: {
          content_segments: {
            include: {
              segment: {
                select: {
                  segment_id: true,
                  title: true,
                  paragraph: true,
                },
              },
            },
          },
          content_ingredients: {
            include: {
              ingredient: {
                select: {
                  ingredient_id: true,
                  quantity: true,
                  product: {
                    select: {
                      product_id: true,
                      name: true,
                      en_name: true,
                      macro: { select: { calories: true, protein: true } },
                    },
                  },
                  ingredient_units: {
                    include: {
                      unit: { select: { unit_id: true, name: true } },
                    },
                  },
                },
              },
            },
          },
          content_prep_times: {
            include: {
              prep_time: {
                select: {
                  prep_time_id: true,
                  duration: true,
                  style: { select: { category_id: true, str_value: true } },
                },
              },
            },
          },
        },
      },
      reviews: true,
      tags: {
        include: {
          category: {
            select: { category_id: true, str_value: true, type: true },
          },
        },
      },
    };
  }
}
