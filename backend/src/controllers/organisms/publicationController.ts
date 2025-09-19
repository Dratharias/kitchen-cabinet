import { Publication, PublicationCore, PublicationRelations } from "types/controller.types";
import { GenericPaginatedController } from "types/crud.types";
import { ReadAllParams, PaginatedResponse } from "types/db.types";
import { PublicationConnect } from "types/dto.types";
import { v4 as uuidv4 } from "uuid";
import { prisma } from "../../config.js";

export const normalizePublication = (pub: any): Publication => ({
  publication_id: pub.publication_id,
  title: pub.title,
  description: pub.description ?? [],
  note: pub.note ?? [],
  public: pub.public,
  published: pub.published,
  thumbnail: pub.thumbnail ?? null,
  type_id: pub.type_id ?? null,
  style_id: pub.style_id ?? null,
  author_id: pub.author_id ?? null,

  type: pub.type ?? null,
  style: pub.style ?? null,
  author: pub.author ?? null,
  contents: pub.contents ?? null,
  ingredientsRef: pub.ingredientsRef ?? null,
  reviews: pub.reviews ?? null,
  tags: pub.tags ?? null,
});

export class PublicationController
  implements GenericPaginatedController<Publication, PublicationCore, PublicationRelations, PublicationConnect>
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
        type_id: payload.type_id,
        style_id: payload.style_id,
        author_id: payload.author_id,
      },
      include: {
        type: true,
        style: true,
        author: true,
        contents: true,
        ingredientsRef: true,
        reviews: true,
        tags: true,
      },
    });

    return normalizePublication(publication);
  }

  async findById(id: string): Promise<Publication | null> {
    const publication = await prisma.publication.findUnique({
      where: { publication_id: id },
      include: {
        type: true,
        style: true,
        author: true,
        contents: true,
        ingredientsRef: true,
        reviews: true,
        tags: true,
      },
    });
    return publication ? normalizePublication(publication) : null;
  }

  async findAll(params?: ReadAllParams<Publication>): Promise<PaginatedResponse<Publication>> {
    const where: any = {};

    if (params?.filter) {
      Object.assign(where, params.filter);
    }

    const total = await prisma.publication.count({ where });

    const limit = params?.take ? Number(params.take) : 12;
    const skip = params?.skip ? Number(params.skip) : 0;

    const publications = await prisma.publication.findMany({
      where,
      include: params?.includeRelations !== false ? {
        type: true,
        style: true,
        author: true,
        contents: true,
        ingredientsRef: true,
        reviews: true,
        tags: true,
      } : undefined,
      skip,
      take: limit,
    });

    const items = publications.map(normalizePublication);

    const page = Math.floor(skip / limit) + 1;
    const totalPages = Math.ceil(total / limit);

    return { items, total, page, limit, totalPages };
  }

  async update(
    id: string,
    payload: Partial<PublicationCore & PublicationRelations> & {
      connect?: Partial<PublicationConnect>;
      set?: Partial<PublicationConnect>;
    }
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
        type_id: payload.type_id,
        style_id: payload.style_id,
        author_id: payload.author_id,

        contents: payload.connect?.contents
          ? { connect: payload.connect.contents.map((c: { content_id: string; }) => ({ content_id: c.content_id })) }
          : payload.set?.contents
          ? { set: payload.set.contents.map((c: { content_id: string; }) => ({ content_id: c.content_id })) }
          : undefined,

        ingredientsRef: payload.connect?.ingredientsRef
          ? { connect: payload.connect.ingredientsRef.map((i: { ingredient_id: string; }) => ({ ingredient_id: i.ingredient_id })) }
          : payload.set?.ingredientsRef
          ? { set: payload.set.ingredientsRef.map((i: { ingredient_id: string; }) => ({ ingredient_id: i.ingredient_id })) }
          : undefined,

        reviews: payload.connect?.reviews
          ? { connect: payload.connect.reviews.map((r: { review_id: string; }) => ({ review_id: r.review_id })) }
          : payload.set?.reviews
          ? { set: payload.set.reviews.map((r: { review_id: string; }) => ({ review_id: r.review_id })) }
          : undefined,

        tags: payload.connect?.tags
          ? {
              connect: payload.connect.tags.map((t: { category_id: string; }) => ({
                publication_id_category_id: {
                  publication_id: id,
                  category_id: t.category_id,
                },
              })),
            }
          : payload.set?.tags
          ? {
              set: payload.set.tags.map((t: { category_id: string; }) => ({
                publication_id_category_id: {
                  publication_id: id,
                  category_id: t.category_id,
                },
              })),
            }
          : undefined,
      },
      include: {
        type: true,
        style: true,
        author: true,
        contents: true,
        ingredientsRef: true,
        reviews: true,
        tags: true,
      },
    });

    return normalizePublication(publication);
  }

  async delete(id: string): Promise<{ deleted: boolean }> {
    await prisma.publication.delete({ where: { publication_id: id } });
    return { deleted: true };
  }
}