import { PrismaClient } from "@prisma/client";
import { GenericPaginatedController } from "types/crud.types.js";
import { PublicationCore, PublicationRelations } from "types/controller.types.js";
import { PublicationCreateDto, PublicationUpdateDto, PublicationReadDto, PublicationReadAllDto } from "types/dto.types.js";
import { v4 as uuidv4 } from "uuid";
import { PaginatedResponse, ReviewData } from "types/db.types.js";
import { OrchestratorController } from "../orchestratorController.js";

const prisma = new PrismaClient();

export const normalizePublication = (pub: any): PublicationReadDto => ({
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

  averageCount: pub.reviews?.length ?? 0,
  averageScore: (pub.reviews?.length ?? 0) > 0
    ? pub.reviews.reduce((sum: number, r: ReviewData) => sum + (r.rating ?? 0), 0) / pub.reviews.length
    : 0,

  type: pub.type ?? null,
  style: pub.style ?? null,
  author: pub.author ?? null,

  contents: pub.contents ?? null,
  ingredientsRef: pub.ingredientsRef ?? null,
  tags: pub.tags ?? null,
});

export class PublicationController
  implements GenericPaginatedController<PublicationReadDto, PublicationCore, PublicationRelations>
{
  constructor(private orchestrator?: OrchestratorController) {}

  async create(payload: PublicationCore & { connect?: PublicationCreateDto["connect"] }): Promise<PublicationReadDto> {
    if (this.orchestrator) {
      const created = await this.orchestrator.createEntity('publications', payload);
      return this.findById(created.publication_id) as Promise<PublicationReadDto>;
    }

    const newId = uuidv4();
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

        contents: payload.connect?.contents ? { connect: payload.connect.contents } : undefined,
        ingredientsRef: payload.connect?.ingredientsRef ? { connect: payload.connect.ingredientsRef } : undefined,
        reviews: payload.connect?.reviews ? { connect: payload.connect.reviews } : undefined,
        tags: payload.connect?.tags
          ? {
              connect: payload.connect.tags.map((t) => ({
                publication_id_category_id: {
                  publication_id: newId,
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

  async findById(id: string): Promise<PublicationReadDto | null> {
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

async findAll(params?: PublicationReadAllDto): Promise<PaginatedResponse<PublicationReadDto>> {
  const where: any = {};

  if (params?.filter) {
    const { tagIds, contentIds, ...directFields } = params.filter;
    Object.assign(where, directFields);

    if (tagIds?.length) where.tags = { some: { category_id: { in: tagIds } } };
    if (contentIds?.length) where.contents = { some: { content_id: { in: contentIds } } };
  }

  const total = await prisma.publication.count({ where });

  const limit = params?.take ? Number(params.take) : 12;
  const skip = params?.skip ? Number(params.skip) : 0;

  const publications = await prisma.publication.findMany({
    where,
    include: {
      type: true,
      style: true,
      author: true,
      contents: true,
      ingredientsRef: true,
      reviews: true,
      tags: true,
    },
    skip,
    take: limit,
  });

  const items = publications.map(normalizePublication);

  const page = Math.floor(skip / limit) + 1;
  const totalPages = Math.ceil(total / limit);

  return { items, total, page, limit, totalPages };
}

  async update(id: string, payload: PublicationUpdateDto): Promise<PublicationReadDto> {

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
          ? { connect: payload.connect.contents }
          : payload.set?.contents
          ? { set: payload.set.contents }
          : undefined,

        ingredientsRef: payload.connect?.ingredientsRef
          ? { connect: payload.connect.ingredientsRef }
          : payload.set?.ingredientsRef
          ? { set: payload.set.ingredientsRef }
          : undefined,

        reviews: payload.connect?.reviews
          ? { connect: payload.connect.reviews }
          : payload.set?.reviews
          ? { set: payload.set.reviews }
          : undefined,

        tags: payload.connect?.tags
          ? {
              connect: payload.connect.tags.map((t) => ({
                publication_id_category_id: {
                  publication_id: id,
                  category_id: t.category_id,
                },
              })),
            }
          : payload.set?.tags
          ? {
              set: payload.set.tags.map((t) => ({
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