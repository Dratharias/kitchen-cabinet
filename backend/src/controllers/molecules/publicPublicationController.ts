import { PrismaClient } from "@prisma/client";
import { PublicationReadAllDto } from "../../types/dto.types.js";
import { normalizePublication, PublicationController } from "../organisms/publicationController.js";

const prisma = new PrismaClient();

export class PublicPublicationController extends PublicationController {
  async findAll(params?: PublicationReadAllDto) {
    const where: any = { public: true, published: true };

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

  async findById(id: string) {
    const publication = await prisma.publication.findFirst({
      where: { publication_id: id, public: true, published: true },
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
}
