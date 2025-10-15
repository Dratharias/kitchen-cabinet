import { prisma } from "../../config.js";
import { GenericController } from "types/crud.types.js";
import {
  GalleryCore,
  GalleryRelations,
  Gallery,
} from "types/controller.types.js";
import { GalleryCreateDto, GalleryUpdateDto } from "types/dto.types.js";
import { v4 as uuidv4 } from "uuid";
import { Prisma } from "@prisma/client";

// NOTE: Assurez-vous que GalleryCore, GalleryRelations, Gallery,
// GalleryCreateDto, et GalleryUpdateDto sont définis dans vos fichiers de types
// (par exemple, dans db.types.ts et controller.types.ts).

export const normalizeGallery = (gallery: any): Gallery => ({
  gallery_id: gallery.gallery_id,
  order_num: gallery.order_num,
  url: gallery.url,
  label: gallery.label,
  // Relations (si Gallery est relié à Publication/Content via une table de jonction, l'inclure ici)
});

export class GalleryController
  implements GenericController<Gallery, GalleryCore, GalleryRelations>
{
  // =====================================================
  // CREATE
  // =====================================================
  async create(
    payload: GalleryCore & { connect?: GalleryCreateDto["connect"] },
  ): Promise<Gallery> {
    const newId = payload.gallery_id ?? uuidv4();

    const gallery = await prisma.gallery.create({
      data: {
        gallery_id: newId,
        order_num: payload.order_num,
        url: payload.url,
        label: payload.label ?? null,
        // Gérez ici la connexion aux tables de jonction (ex: PublicationGallery)
      },
      // Inclure les relations si nécessaire
    });

    return normalizeGallery(gallery);
  }

  // =====================================================
  // READ
  // =====================================================
  async findById(id: string): Promise<Gallery | null> {
    const gallery = await prisma.gallery.findUnique({
      where: { gallery_id: id },
      // Inclure les relations si nécessaire
    });
    return gallery ? normalizeGallery(gallery) : null;
  }

  async findAll(): Promise<Gallery[]> {
    const galleries = await prisma.gallery.findMany({});
    return galleries.map(normalizeGallery);
  }

  // =====================================================
  // UPDATE (supporte PUT et PATCH)
  // =====================================================
  async update(id: string, payload: GalleryUpdateDto): Promise<Gallery> {
    const data: Prisma.galleryUpdateInput = {};

    // Mappage des champs scalaires (PATCH)
    if (payload.order_num !== undefined) data.order_num = payload.order_num;
    if (payload.url !== undefined) data.url = payload.url;
    if (payload.label !== undefined) data.label = payload.label;

    const gallery = await prisma.gallery.update({
      where: { gallery_id: id },
      data: {
        ...data,
        // Gérez ici la déconnexion/reconnexion des tables de jonction
      },
      // Inclure les relations si nécessaire
    });

    return normalizeGallery(gallery);
  }

  // =====================================================
  // DELETE
  // =====================================================
  async delete(id: string): Promise<{ deleted: boolean }> {
    await prisma.gallery.delete({ where: { gallery_id: id } });
    return { deleted: true };
  }
}
