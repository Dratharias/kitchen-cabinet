import { prisma } from "../../config.js";
import { GenericController } from "types/crud.types.js";
import {
  ContentCore,
  ContentRelations,
  Content,
  Servings,
} from "types/controller.types.js";
import {
  ContentCreateDto,
  ContentUpdateDto,
  ContentConnect,
} from "types/dto.types.js";
import { v4 as uuidv4 } from "uuid";
import { Prisma } from "@prisma/client";

const contentInclude = {
  publication: true,
  servings: true,
  content_segments: true,
  content_ingredients: true,
  content_prep_times: true,
};

/**
 * Normalizes a Prisma content object into the API Content type.
 */
export const normalizeContent = (content: any): Content => ({
  content_id: content.content_id,
  publication_id: content.publication_id,
  total_prep_time: content.total_prep_time,
  servings: content.servings ? (content.servings as Servings) : null,
  subtitle: content.subtitle ?? null,
  is_ingredient: content.is_ingredient ?? false,
  gallery: content.gallery ?? null,
  serving_id: content.serving_id ?? null,

  publication: content.publication ?? null,
  content_segments: content.content_segments ?? null,
  content_ingredients: content.content_ingredients ?? null,
  content_prep_times: content.content_prep_times ?? null,
});

/**
 * Helper to upsert or connect a Servings record.
 */
async function upsertServings(
  client: Prisma.TransactionClient | typeof prisma,
  data: any,
): Promise<string | undefined> {
  if (!data || data.yield === undefined) return undefined;
  const id = data.serving_id ?? uuidv4();

  const servings = await client.servings.upsert({
    where: { serving_id: id },
    create: {
      serving_id: id,
      yield: data.yield,
      value: data.value ?? "portion(s)",
    },
    update: {
      yield: data.yield,
      value: data.value ?? "portion(s)",
    },
  });
  return servings.serving_id;
}

export class ContentController
  implements
    GenericController<
      Content,
      ContentCore,
      ContentRelations,
      ContentConnect,
      ContentConnect
    >
{
  async create(
    payload: ContentCore & { connect?: ContentCreateDto["connect"] },
  ): Promise<Content> {
    const newId = payload.content_id ?? uuidv4();
    if (!payload.publication_id)
      throw new Error("Publication ID is required to create Content.");

    let serving_id: string | null | undefined = payload.serving_id;
    const upsertPayload = payload as ContentCore & { servings?: any };

    if (upsertPayload.servings && typeof upsertPayload.servings === "object") {
      serving_id = await upsertServings(prisma, upsertPayload.servings);
    } else if (payload.connect?.servings?.[0]) {
      serving_id = await upsertServings(
        prisma,
        payload.connect.servings[0] as any,
      );
    }

    const content = await prisma.content.create({
      data: {
        content_id: newId,

        publication: { connect: { publication_id: payload.publication_id } },

        total_prep_time: payload.total_prep_time,

        servings: serving_id
          ? { connect: { serving_id: serving_id } }
          : undefined,

        subtitle: payload.subtitle,
        is_ingredient: payload.is_ingredient,

        content_segments: payload.connect?.content_segments
          ? {
              connect: payload.connect.content_segments.map((c) => ({
                content_id_segment_id: {
                  content_id: newId,
                  segment_id: c.segment_id,
                },
              })),
            }
          : undefined,

        content_ingredients: payload.connect?.content_ingredients
          ? {
              connect: payload.connect.content_ingredients.map((c) => ({
                content_id_ingredient_id: {
                  content_id: newId,
                  ingredient_id: c.ingredient_id,
                },
              })),
            }
          : undefined,

        content_prep_times: payload.connect?.content_prep_times
          ? {
              connect: payload.connect.content_prep_times.map((c) => ({
                content_id_prep_time_id: {
                  content_id: newId,
                  prep_time_id: c.prep_time_id,
                },
              })),
            }
          : undefined,
      },
      include: contentInclude,
    });

    return normalizeContent(content);
  }

  async findById(id: string): Promise<Content | null> {
    const content = await prisma.content.findUnique({
      where: { content_id: id },
      include: contentInclude,
    });
    return content ? normalizeContent(content) : null;
  }

  async findAll(): Promise<Content[]> {
    const contents = await prisma.content.findMany({
      include: contentInclude,
    });
    return contents.map(normalizeContent);
  }

  async update(id: string, payload: ContentUpdateDto): Promise<Content> {
    const data: Prisma.contentUpdateInput = {};

    if (payload.publication_id) {
      data.publication = {
        connect: { publication_id: payload.publication_id },
      };
    }

    if (payload.total_prep_time !== undefined)
      data.total_prep_time = payload.total_prep_time;
    if (payload.subtitle !== undefined) data.subtitle = payload.subtitle;
    if (payload.is_ingredient !== undefined)
      data.is_ingredient = payload.is_ingredient;

    const upsertPayload = payload as ContentUpdateDto & { servings?: any };
    let determined_serving_id: string | null | undefined = undefined;

    if (upsertPayload.servings && typeof upsertPayload.servings === "object") {
      determined_serving_id = await upsertServings(
        prisma,
        upsertPayload.servings,
      );
    } else if (payload.connect?.servings?.[0]) {
      determined_serving_id = await upsertServings(
        prisma,
        payload.connect.servings[0] as any,
      );
    }

    if (determined_serving_id !== undefined) {
      if (determined_serving_id) {
        data.servings = { connect: { serving_id: determined_serving_id } };
      } else {
        data.servings = { disconnect: true };
      }
    }

    const content = await prisma.content.update({
      where: { content_id: id },
      data: {
        ...data,

        content_segments: payload.connect?.content_segments
          ? {
              connect: payload.connect.content_segments.map((c) => ({
                content_id_segment_id: {
                  content_id: id,
                  segment_id: c.segment_id,
                },
              })),
            }
          : payload.set?.content_segments
            ? {
                set: payload.set.content_segments.map((c) => ({
                  content_id_segment_id: {
                    content_id: id,
                    segment_id: c.segment_id,
                  },
                })),
              }
            : undefined,

        content_ingredients: payload.connect?.content_ingredients
          ? {
              connect: payload.connect.content_ingredients.map((c) => ({
                content_id_ingredient_id: {
                  content_id: id,
                  ingredient_id: c.ingredient_id,
                },
              })),
            }
          : payload.set?.content_ingredients
            ? {
                set: payload.set.content_ingredients.map((c) => ({
                  content_id_ingredient_id: {
                    content_id: id,
                    ingredient_id: c.ingredient_id,
                  },
                })),
              }
            : undefined,

        content_prep_times: payload.connect?.content_prep_times
          ? {
              connect: payload.connect.content_prep_times.map((c) => ({
                content_id_prep_time_id: {
                  content_id: id,
                  prep_time_id: c.prep_time_id,
                },
              })),
            }
          : payload.set?.content_prep_times
            ? {
                set: payload.set.content_prep_times.map((c) => ({
                  content_id_prep_time_id: {
                    content_id: id,
                    prep_time_id: c.prep_time_id,
                  },
                })),
              }
            : undefined,
      },
      include: contentInclude,
    });

    return normalizeContent(content);
  }

  async delete(id: string): Promise<{ deleted: boolean }> {
    const content = await prisma.content.findUnique({
      where: { content_id: id },
      select: { serving_id: true },
    });

    await prisma.content.delete({ where: { content_id: id } });

    if (content?.serving_id) {
      const count = await prisma.content.count({
        where: { serving_id: content.serving_id },
      });
      if (count === 0) {
        await prisma.servings.delete({
          where: { serving_id: content.serving_id },
        });
      }
    }

    return { deleted: true };
  }
}
