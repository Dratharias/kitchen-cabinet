import { prisma } from "../../config.js";
import { GenericController } from "types/crud.types.js";
import {
  ContentCore,
  ContentRelations,
  Content,
} from "types/controller.types.js";
import { ContentCreateDto, ContentUpdateDto } from "types/dto.types.js";
import { v4 as uuidv4 } from "uuid";
import { Prisma } from "@prisma/client";

export const normalizeContent = (content: any): Content => ({
  content_id: content.content_id,
  publication_id: content.publication_id,
  total_prep_time: content.total_prep_time,
  // NOTE: Le champ `servings` doit être ajusté pour devenir un objet
  servings: content.servings ?? null, 
  subtitle: content.subtitle,
  is_ingredient: content.is_ingredient,
  // Rétrocompatibilité, sera supprimé si Gallery devient une table
  gallery: content.gallery ?? null, 

  publication: content.publication ?? null,
  content_segments: content.content_segments ?? null,
  content_ingredients: content.content_ingredients ?? null,
  content_prep_times: content.content_prep_times ?? null,
});

// Helper pour upsert/connect Servings (si vous adoptez la FK)
async function upsertServings(tx: Prisma.TransactionClient, data: any): Promise<string | undefined> {
    if (!data || data.yield === undefined) return undefined;
    
    // Si l'ID est fourni, on tente une mise à jour, sinon une création
    const id = data.serving_id ?? uuidv4(); 
    
    const servings = await tx.servings.upsert({
        where: { serving_id: id },
        create: { 
            serving_id: id, 
            yield: data.yield, 
            value: data.value ?? "portion(s)" 
        },
        update: { 
            yield: data.yield, 
            value: data.value ?? "portion(s)" 
        },
    });
    return servings.serving_id;
}


export class ContentController
  implements GenericController<Content, ContentCore, ContentRelations>
{
  async create(
    payload: ContentCore & { connect?: ContentCreateDto["connect"] },
  ): Promise<Content> {
    const newId = payload.content_id ?? uuidv4();
    if (!payload.publication_id) throw new Error("Publication ID is required to create Content.");
    
    // Gestion du Servings (Upsert requis pour la relation 1-N)
    const serving_id = await upsertServings(prisma, payload.connect?.servings?.[0] as any);

    const content = await prisma.content.create({
      data: {
        content_id: newId,
        publication_id: payload.publication_id,
        total_prep_time: payload.total_prep_time,
        serving_id: serving_id, // Utilise la FK
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
    const data: Prisma.contentUpdateInput = {};
    
    // Mappage des champs scalaires (PATCH)
    if (payload.publication_id !== undefined) data.publication_id = payload.publication_id;
    if (payload.total_prep_time !== undefined) data.total_prep_time = payload.total_prep_time;
    if (payload.subtitle !== undefined) data.subtitle = payload.subtitle;
    if (payload.gallery !== undefined) data.gallery = payload.gallery;
    if (payload.is_ingredient !== undefined) data.is_ingredient = payload.is_ingredient;

    // Gestion du Servings lors de la mise à jour
    if (payload.connect?.servings?.[0]) {
        // Supposons que payload.connect.servings[0] contient { serving_id, yield, value }
        const serving_id = await upsertServings(prisma, payload.connect.servings[0] as any);
        if (serving_id) {
            data.serving_id = serving_id;
        }
    }


    const content = await prisma.content.update({
      where: { content_id: id },
      data: {
        ...data,
        // Les connexions aux tables de jointure (N-N) sont gérées via les DTOs connect/set/disconnect
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
