import { prisma } from "../../config.js";
import { GenericController } from "types/crud.types.js";
import {
  ContentCore,
  ContentRelations,
  Content,
} from "types/controller.types.js";
import { ContentCreateDto, ContentUpdateDto } from "types/dto.types.js";
import { v4 as uuidv4 } from "uuid";

export const normalizeContent = (content: any): Content => ({
  content_id: content.content_id,
  publication_id: content.publication_id,
  total_prep_time: content.total_prep_time,
  servings: content.servings,
  subtitle: content.subtitle,
  is_ingredient: content.is_ingredient,
  gallery: content.gallery,

  publication: content.publication ?? null,
  content_segments: content.content_segments ?? null,
  content_ingredients: content.content_ingredients ?? null,
  content_prep_times: content.content_prep_times ?? null,
});

export class ContentController
  implements GenericController<Content, ContentCore, ContentRelations>
{
  async create(
    payload: ContentCore & { connect?: ContentCreateDto["connect"] },
  ): Promise<Content> {
    const newId = uuidv4();
    const content = await prisma.content.create({
      data: {
        content_id: newId,
        publication_id: payload.publication_id,
        total_prep_time: payload.total_prep_time,
        servings: payload.servings,
        subtitle: payload.subtitle,
        gallery: payload.gallery,
        is_ingredient: payload.is_ingredient,

        content_segments: payload.connect?.content_segments
          ? {
              connect: payload.connect.content_segments.map((s) => ({
                content_id_segment_id: {
                  content_id: newId,
                  segment_id: s.segment_id,
                },
              })),
            }
          : undefined,

        content_ingredients: payload.connect?.content_ingredients
          ? {
              connect: payload.connect.content_ingredients.map((i) => ({
                content_id_ingredient_id: {
                  content_id: newId,
                  ingredient_id: i.ingredient_id,
                },
              })),
            }
          : undefined,

        content_prep_times: payload.connect?.content_prep_times
          ? {
              connect: payload.connect.content_prep_times.map((p) => ({
                content_id_prep_time_id: {
                  content_id: newId,
                  prep_time_id: p.prep_time_id,
                },
              })),
            }
          : undefined,
      },
      include: {
        publication: true,
        content_segments: true,
        content_ingredients: true,
        content_prep_times: true,
      },
    });

    return normalizeContent(content);
  }

  async findById(id: string): Promise<Content | null> {
    const content = await prisma.content.findUnique({
      where: { content_id: id },
      include: {
        publication: true,
        content_segments: true,
        content_ingredients: true,
        content_prep_times: true,
      },
    });
    return content ? normalizeContent(content) : null;
  }

  async findAll(): Promise<Content[]> {
    const contents = await prisma.content.findMany({
      include: {
        publication: true,
        content_segments: true,
        content_ingredients: true,
        content_prep_times: true,
      },
    });
    return contents.map(normalizeContent);
  }

  async update(id: string, payload: ContentUpdateDto): Promise<Content> {
    const content = await prisma.content.update({
      where: { content_id: id },
      data: {
        publication_id: payload.publication_id,
        total_prep_time: payload.total_prep_time,
        servings: payload.servings,
        subtitle: payload.subtitle,
        gallery: payload.gallery,
        is_ingredient: payload.is_ingredient ?? null,

        content_segments: payload.connect?.content_segments
          ? {
              connect: payload.connect.content_segments.map((s) => ({
                content_id_segment_id: {
                  content_id: id,
                  segment_id: s.segment_id,
                },
              })),
            }
          : payload.set?.content_segments
            ? {
                set: payload.set.content_segments.map((s) => ({
                  content_id_segment_id: {
                    content_id: id,
                    segment_id: s.segment_id,
                  },
                })),
              }
            : undefined,

        content_ingredients: payload.connect?.content_ingredients
          ? {
              connect: payload.connect.content_ingredients.map((i) => ({
                content_id_ingredient_id: {
                  content_id: id,
                  ingredient_id: i.ingredient_id,
                },
              })),
            }
          : payload.set?.content_ingredients
            ? {
                set: payload.set.content_ingredients.map((i) => ({
                  content_id_ingredient_id: {
                    content_id: id,
                    ingredient_id: i.ingredient_id,
                  },
                })),
              }
            : undefined,

        content_prep_times: payload.connect?.content_prep_times
          ? {
              connect: payload.connect.content_prep_times.map((p) => ({
                content_id_prep_time_id: {
                  content_id: id,
                  prep_time_id: p.prep_time_id,
                },
              })),
            }
          : payload.set?.content_prep_times
            ? {
                set: payload.set.content_prep_times.map((p) => ({
                  content_id_prep_time_id: {
                    content_id: id,
                    prep_time_id: p.prep_time_id,
                  },
                })),
              }
            : undefined,
      },
      include: {
        publication: true,
        content_segments: true,
        content_ingredients: true,
        content_prep_times: true,
      },
    });

    return normalizeContent(content);
  }

  async delete(id: string): Promise<{ deleted: boolean }> {
    await prisma.content.delete({ where: { content_id: id } });
    return { deleted: true };
  }
}
