import { PrismaClient } from "@prisma/client";
import { GenericController } from "types/crud.types";
import { PublicationData, ContentData, IngredientData, ReviewData, PublicationTagData } from "types/db.types";
import { PublicationUpsert } from "types/controller.types";
import { v4 as uuidv4 } from "uuid";

const prisma = new PrismaClient();

export function normalizePublication(pub: any): PublicationData {
  return {
    ...pub,
    type: pub.type ?? null,
    style: pub.style ?? null,
    author: pub.author ?? null,
    contents: pub.contents ?? null,
    ingredientsRef: pub.ingredientsRef ?? null,
    reviews: pub.reviews ?? null,
    tags: pub.tags ?? null,
  };
}

export class PublicationController
  implements GenericController<PublicationData, PublicationUpsert, PublicationUpsert>
{
  async create(payload: PublicationUpsert): Promise<PublicationData> {
    const publication = await prisma.publication.create({
      data: {
        publication_id: uuidv4(),
        title: payload.title,
        description: payload.description,
        note: payload.note,
        public: payload.public,
        published: payload.published,
        thumbnail: payload.thumbnail,
        type_id: payload.type_id,
        style_id: payload.style_id,
        author_id: payload.author_id,
        // Relations
        contents: payload.contents?.length
          ? { create: payload.contents.map(c => ({ ...c, content_id: uuidv4() })) }
          : undefined,
        ingredientsRef: payload.ingredientsRef?.length
          ? { connect: payload.ingredientsRef.map(i => ({ ingredient_id: i.ingredient_id })) }
          : undefined,
        reviews: payload.reviews?.length
          ? { create: payload.reviews.map(r => ({ ...r, review_id: uuidv4() })) }
          : undefined,
        tags: payload.tags?.length
          ? { create: payload.tags.map(t => ({ category_id: t.category_id })) }
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

  async findById(id: string): Promise<PublicationData | null> {
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

  async findAll(): Promise<PublicationData[]> {
    const publications = await prisma.publication.findMany({
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

    return publications.map(normalizePublication);
  }

  async update(id: string, payload: PublicationUpsert): Promise<PublicationData> {
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
        // Relations: handle create/connect/disconnect as needed
        contents: payload.contents?.length
          ? { upsert: payload.contents.map(c => ({
              where: { content_id: c.content_id },
              update: { ...c },
              create: { ...c, content_id: c.content_id || uuidv4() },
            })) }
          : undefined,
        ingredientsRef: payload.ingredientsRef?.length
          ? { set: payload.ingredientsRef.map(i => ({ ingredient_id: i.ingredient_id })) }
          : undefined,
        reviews: payload.reviews?.length
          ? { upsert: payload.reviews.map(r => ({
              where: { review_id: r.review_id },
              update: { ...r },
              create: { ...r, review_id: r.review_id || uuidv4() },
            })) }
          : undefined,
        tags: payload.tags?.length
          ? { set: payload.tags.map(t => ({ category_id: t.category_id })) }
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
