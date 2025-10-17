import { Prisma } from "@prisma/client";
import { prisma } from "../../config.js";
import { v4 as uuidv4 } from "uuid";
import {
  shapePublicPublicationFull,
  shapePublicPublicationSummary,
} from "../../utils/shapePublication.js";
import type {
  Publication,
  PublicationCore,
  PublicationRelations,
} from "types/controller.types";
import type { GenericPaginatedController } from "types/crud.types";
import type {
  PublicationReadAllDto,
  PublicationConnect,
  PublicationUpdateDto,
} from "types/dto.types";
import type { UserRoleData } from "types/db.types.js";

// A simple type to represent the user payload attached by the auth handler
type UserPayload = { userId: string; role: UserRoleData } | null;

export class PublicationController
  implements
    GenericPaginatedController<
      Publication,
      PublicationCore,
      PublicationRelations,
      PublicationConnect,
      PublicationConnect
    >
{
  // =====================================================
  // CREATE, UPDATE, DELETE (no changes needed)
  // =====================================================
  async create(
    payload: PublicationCore & { connect?: PublicationConnect },
  ): Promise<Publication> {
    const newId = payload.publication_id ?? uuidv4();
    const type_id = payload.connect?.type?.[0]?.category_id;
    const style_id = payload.connect?.style?.[0]?.category_id;
    const author_id = payload.connect?.author?.[0]?.category_id;

    const pub = await prisma.publication.create({
      data: {
        publication_id: newId,
        title: payload.title,
        description: payload.description ?? [],
        note: payload.note ?? [],
        public: payload.public ?? true,
        published: payload.published ?? true,
        thumbnail: payload.thumbnail ?? null,
        type_id,
        style_id,
        author_id,
        tags: payload.connect?.tags
          ? {
              create: payload.connect.tags.map((t) => ({
                publication_id: newId,
                category_id: t.category_id,
              })),
            }
          : undefined,
      },
      include: this.buildFullInclude(),
    });
    return shapePublicPublicationFull(pub);
  }

  async update(
    id: string,
    payload: PublicationUpdateDto,
  ): Promise<Publication> {
    const data: Prisma.publicationUpdateInput = {};
    if (payload.title !== undefined) data.title = payload.title;
    if (payload.description !== undefined)
      data.description = payload.description;
    if (payload.note !== undefined) data.note = payload.note;
    if (payload.public !== undefined) data.public = payload.public;
    if (payload.published !== undefined) data.published = payload.published;
    if (payload.thumbnail !== undefined) data.thumbnail = payload.thumbnail;
    if (payload.connect?.type?.[0])
      data.type = { connect: payload.connect.type[0] };
    if (payload.connect?.style?.[0])
      data.style = { connect: payload.connect.style[0] };
    if (payload.connect?.author?.[0])
      data.author = { connect: payload.connect.author[0] };

    if (payload.connect?.tags)
      data.tags = {
        connect: payload.connect.tags.map((t) => ({
          publication_id_category_id: {
            publication_id: id,
            category_id: t.category_id,
          },
        })),
      };
    if (payload.set?.tags)
      data.tags = {
        set: payload.set.tags.map((t) => ({
          publication_id_category_id: {
            publication_id: id,
            category_id: t.category_id,
          },
        })),
      };

    const pub = await prisma.publication.update({
      where: { publication_id: id },
      data,
      include: this.buildFullInclude(),
    });
    return shapePublicPublicationFull(pub);
  }

  async delete(id: string): Promise<{ deleted: boolean }> {
    await prisma.publication.delete({ where: { publication_id: id } });
    return { deleted: true };
  }

  // =====================================================
  // READ BY ID (with auth-based filtering)
  // =====================================================
  async findById(id: string, user?: UserPayload): Promise<Publication | null> {
    const where: Prisma.publicationWhereInput = { publication_id: id };

    // If the user is a guest, only allow access to public and published items
    if (!user) {
      where.public = true;
      where.published = true;
    }

    const pub = await prisma.publication.findFirst({
      where,
      include: this.buildFullInclude(),
    });

    return pub ? shapePublicPublicationFull(pub) : null;
  }

  // =====================================================
  // READ ALL (with auth-based filtering)
  // =====================================================
  async findAll(
    params?: PublicationReadAllDto,
    user?: UserPayload,
  ): Promise<{
    items: Publication[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const limit = Number(params?.limit) || 12;
    const page = Number(params?.page) || 1;
    const skip = (page - 1) * limit;
    const sortBy = params?.sortBy || "title";
    const order = params?.order === "desc" ? "desc" : "asc";

    // If no user is present on the request, this is a public query.
    const isPublicQuery = !user;

    const filter = params?.filter ?? {};
    const q = typeof filter.q === "string" ? filter.q.trim() : null;
    const typeField = (filter as any).type;
    const types: string[] = Array.isArray(typeField)
      ? typeField
      : typeField
        ? [typeField]
        : [];

    const where: Prisma.publicationWhereInput = {
      AND: [
        isPublicQuery ? { public: true, published: true } : {},
        types.length ? { type: { str_value: { in: types } } } : {},
        q
          ? {
              OR: [
                { title: { contains: q, mode: "insensitive" } },
                { description: { has: q } },
              ],
            }
          : {},
      ],
    };

    const total = await prisma.publication.count({ where });
    const pubs = await prisma.publication.findMany({
      where,
      include: this.buildSummaryInclude(),
      skip,
      take: limit,
      orderBy: { [sortBy]: order },
    });

    const items = pubs.map(shapePublicPublicationSummary);
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  // =====================================================
  // PRISMA INCLUDES (no changes)
  // =====================================================
  private buildSummaryInclude() {
    return {
      type: true,
      style: true,
      author: true,
      tags: {
        include: {
          category: {
            select: { category_id: true, str_value: true, type: true },
          },
        },
      },
      contents: {
        select: {
          content_id: true,
          total_prep_time: true,
          servings: true,
          subtitle: true,
          is_ingredient: true,
        },
      },
      reviews: { select: { rating: true } },
    };
  }

  private buildFullInclude() {
    return {
      type: true,
      style: true,
      author: true,
      tags: {
        include: {
          category: {
            select: { category_id: true, str_value: true, type: true },
          },
        },
      },
      contents: {
        include: {
          servings: true,
          content_segments: {
            include: {
              segment: {
                select: { segment_id: true, title: true, paragraph: true },
              },
            },
          },
          content_ingredients: {
            include: {
              ingredient: {
                select: {
                  ingredient_id: true,
                  quantity: true,
                  multiply_factor: true,
                  cut: true,
                  title: true,
                  product: {
                    select: {
                      product_id: true,
                      name: true,
                      is_recipe_id: true,
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
      reviews: { select: { rating: true, comment: true } },
    };
  }
}
