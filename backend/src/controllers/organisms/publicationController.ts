import {
  Publication,
  PublicationCore,
  PublicationRelations,
  PublicationTag,
  Review,
} from "types/controller.types";
import { GenericPaginatedController } from "types/crud.types";
import { PublicationConnect, PublicationReadAllDto } from "types/dto.types";
import { v4 as uuidv4 } from "uuid";
import { prisma } from "../../config.js";
import { shapePublicPublication } from "../../utils/shapePublication.js";

export const normalizePublication = (pub: any): Publication => {
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
    public: shaped.public,
    published: shaped.published,
    thumbnail: shaped.thumbnail ?? null,
    gallery: shaped.gallery ?? [],
    type: shaped.type ?? null,
    style: shaped.style ?? null,
    author: shaped.author ?? null,
    contents: shaped.contents ?? null,
    productsRef: shaped.productsRef ?? null,
    reviewCount,
    reviewAverageScore,
    tags:
      shaped.tags?.map((tag: PublicationTag) => tag.category?.str_value) ?? [],
  };
};

export class PublicationController
  implements
    GenericPaginatedController<
      Publication,
      PublicationCore,
      PublicationRelations,
      PublicationConnect
    >
{
  async create(payload: PublicationCore): Promise<Publication> {
    const newId = payload.publication_id ?? uuidv4();

    const publication = await prisma.publication.create({
      data: {
        publication_id: newId,
        title: payload.title,
        description: payload.description,
        note: payload.note,
        public: payload.public,
        published: payload.published,
        thumbnail: payload.thumbnail,
        gallery: payload.gallery ?? [],
      },
      include: this.buildInclude(),
    });

    return normalizePublication(publication);
  }

  async findById(id: string): Promise<Publication | null> {
    const publication = await prisma.publication.findUnique({
      where: { publication_id: id },
      include: this.buildInclude(),
    });
    return publication ? normalizePublication(publication) : null;
  }

  async findAll(params?: PublicationReadAllDto) {
    const where: any = {};

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
    const limit = params?.limit
      ? Number(params.limit)
      : params?.take
        ? Number(params.take)
        : 12;
    const page = params?.page ? Number(params.page) : 1;
    const skip = params?.skip ? Number(params.skip) : (page - 1) * limit;

    const publications = await prisma.publication.findMany({
      where,
      include: this.buildInclude(),
      skip,
      take: limit,
    });

    const items = publications.map(normalizePublication);
    const totalPages = Math.ceil(total / limit);

    return { items, total, page, limit, totalPages };
  }

  async update(
    id: string,
    payload: Partial<PublicationCore & PublicationRelations> & {
      connect?: Partial<PublicationConnect>;
      set?: Partial<PublicationConnect>;
    },
  ): Promise<Publication> {
    const publication = await prisma.publication.update({
      where: { publication_id: id },
      data: {
        title: payload.title,
        description: payload.description,
        note: payload.note,
        public: payload.public,
        published: payload.published,
        thumbnail: payload.thumbnail,
        gallery: payload.gallery ?? [],

        contents: payload.connect?.contents
          ? {
              connect: payload.connect.contents.map(
                (c: { content_id: string }) => ({ content_id: c.content_id }),
              ),
            }
          : payload.set?.contents
            ? {
                set: payload.set.contents.map((c: { content_id: string }) => ({
                  content_id: c.content_id,
                })),
              }
            : undefined,

        reviews: payload.connect?.reviews
          ? {
              connect: payload.connect.reviews.map(
                (r: { review_id: string }) => ({ review_id: r.review_id }),
              ),
            }
          : payload.set?.reviews
            ? {
                set: payload.set.reviews.map((r: { review_id: string }) => ({
                  review_id: r.review_id,
                })),
              }
            : undefined,

        tags: payload.connect?.tags
          ? {
              connect: payload.connect.tags.map(
                (t: { category_id: string }) => ({
                  publication_id_category_id: {
                    publication_id: id,
                    category_id: t.category_id,
                  },
                }),
              ),
            }
          : payload.set?.tags
            ? {
                set: payload.set.tags.map((t: { category_id: string }) => ({
                  publication_id_category_id: {
                    publication_id: id,
                    category_id: t.category_id,
                  },
                })),
              }
            : undefined,
      },
      include: this.buildInclude(),
    });

    return normalizePublication(publication);
  }

  async delete(id: string): Promise<{ deleted: boolean }> {
    await prisma.publication.delete({ where: { publication_id: id } });
    return { deleted: true };
  }

  private buildInclude(): any {
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
      tags: { include: { category: true } },
    };
  }
}
