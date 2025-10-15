import { prisma } from "../../config.js";
import { GenericController } from "types/crud.types.js";
import {
  ContentCore,
  ContentRelations,
  Content,
  Servings,
} from "types/controller.types.js";
import { ContentCreateDto, ContentUpdateDto, ServingsConnect } from "types/dto.types.js";
import { v4 as uuidv4 } from "uuid";
import { Prisma } from "@prisma/client";

export const normalizeContent = (content: any): Content => ({
  content_id: content.content_id,
  publication_id: content.publication_id,
  total_prep_time: content.total_prep_time,
  // FIX: Servings est maintenant un objet (relation 1-1) ou null
  servings: content.servings ? (content.servings as Servings) : null,
  subtitle: content.subtitle,
  is_ingredient: content.is_ingredient,
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
  implements GenericController<Content, ContentCore, ContentRelations, ContentConnect, ContentConnect>
{
  async create(
    payload: ContentCore & { connect?: ContentCreateDto["connect"] },
  ): Promise<Content> {
    const newId = payload.content_id ?? uuidv4();
    if (!payload.publication_id) throw new Error("Publication ID is required to create Content.");
    
    // Gestion du Servings (Upsert requis pour la relation 1-N)
    // NOTE: Le frontend utilise `payload.servings` qui est un nombre/objet simple.
    // L'ancien Orchestrator utilisait `payload.connect?.servings?.[0]`. 
    // Ici, nous supposons que le DTO direct contient l'objet Servings pour l'upsert.
    let serving_id: string | undefined = undefined;
    if (payload.servings && typeof payload.servings === 'object') {
        // Le DTO est censé inclure les données Servings (yield, value)
        serving_id = await upsertServings(prisma, payload.servings);
    }
    
    // Si la création est passée par l'orchestrator, le payload.connect est utilisé:
    else if (payload.connect?.servings?.[0]) {
      serving_id = await upsertServings(prisma, payload.connect.servings[0] as any);
    }


    const content = await prisma.content.create({
      data: {
        content_id: newId,
        publication_id: payload.publication_id,
        total_prep_time: payload.total_prep_time,
        serving_id: serving_id, 
        subtitle: payload.subtitle,
        gallery: payload.gallery,
        is_ingredient: payload.is_ingredient,

        content_segments: payload.connect?.content_segments
          ? { connect: payload.connect.content_segments }
          : undefined,

        content_ingredients: payload.connect?.content_ingredients
          ? { connect: payload.connect.content_ingredients }
          : undefined,

        content_prep_times: payload.connect?.content_prep_times
          ? { connect: payload.connect.content_prep_times }
          : undefined,
      },
      include: {
        publication: true,
        servings: true,
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
        servings: true,
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
        servings: true,
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

    // Gestion du Servings lors de la mise à jour (directement via DTO ou via connect)
    if (payload.servings && typeof payload.servings === 'object') {
        // Si le DTO direct est utilisé
        const serving_id = await upsertServings(prisma, payload.servings);
        if (serving_id) {
            data.serving_id = serving_id;
        }
    } else if (payload.connect?.servings?.[0]) {
        // Si la mise à jour est passée par un connect (potentiellement de l'orchestrator)
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
          ? { connect: payload.connect.content_segments }
          : payload.set?.content_segments
            ? { set: payload.set.content_segments }
            : undefined,

        content_ingredients: payload.connect?.content_ingredients
          ? { connect: payload.connect.content_ingredients }
          : payload.set?.content_ingredients
            ? { set: payload.set.content_ingredients }
            : undefined,

        content_prep_times: payload.connect?.content_prep_times
          ? { connect: payload.connect.content_prep_times }
          : payload.set?.content_prep_times
            ? { set: payload.set.content_prep_times }
            : undefined,
      },
      include: {
        publication: true,
        servings: true,
        content_segments: true,
        content_ingredients: true,
        content_prep_times: true,
      },
    });

    return normalizeContent(content);
  }

  async delete(id: string): Promise<{ deleted: boolean }> {
    // Si vous voulez supprimer la portion associée, vous devriez le faire ici
    const content = await prisma.content.findUnique({ where: { content_id: id }, select: { serving_id: true } });
    
    // Supprimer le contenu (cascade sur les tables de jointure)
    await prisma.content.delete({ where: { content_id: id } });
    
    // Supprimer la portion (si elle existait et que c'était la seule référence)
    if (content?.serving_id) {
        // Vérifier si d'autres contenus référencent cette portion (logique simplifiée)
        const count = await prisma.content.count({ where: { serving_id: content.serving_id } });
        if (count === 0) {
            await prisma.servings.delete({ where: { serving_id: content.serving_id } });
        }
    }
    
    return { deleted: true };
  }
}
