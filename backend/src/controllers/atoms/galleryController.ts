import { prisma } from "../../config.js";
import { GenericController } from "types/crud.types.js";
import {
  GalleryCore,
  GalleryRelations,
  Gallery,
} from "types/controller.types.js";
import { GalleryCreateDto, GalleryUpdateDto, GalleryConnect } from "types/dto.types.js";
import { v4 as uuidv4 } from "uuid";
import { Prisma } from "@prisma/client";

export const normalizeGallery = (gallery: any): Gallery => ({
  gallery_id: gallery.gallery_id,
  order_num: gallery.order_num,
  url: gallery.url,
  label: gallery.label,
  content_gallery: gallery.content_gallery ?? null,
});

export class GalleryController
  implements GenericController<Gallery, GalleryCore, GalleryRelations, GalleryConnect, GalleryConnect>
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
        url: payload.url,
        label: payload.label ?? null,
        
        // CORRECTION N-N: Utilisation de la clé composite content_id_gallery_id
        content_gallery: payload.connect?.content_gallery
            ? { 
                connect: payload.connect.content_gallery.map(cg => ({
                    // Nous nous assurons que l'objet de connexion N-N est bien la clé composite
                    content_id_gallery_id: { 
                        content_id: cg.content_id, 
                        gallery_id: newId 
                    }
                })) 
            }
            : undefined,
      },
      include: {
        content_gallery: true,
      }
    });

    return normalizeGallery(gallery);
  }

  // =====================================================
  // READ
  // =====================================================
  async findById(id: string): Promise<Gallery | null> {
    const gallery = await prisma.gallery.findUnique({
      where: { gallery_id: id },
      include: {
        content_gallery: true,
      }
    });
    return gallery ? normalizeGallery(gallery) : null;
  }

  async findAll(): Promise<Gallery[]> {
    const galleries = await prisma.gallery.findMany({
        include: { content_gallery: true }
    });
    return galleries.map(normalizeGallery);
  }

  // =====================================================
  // UPDATE (supporte PUT et PATCH)
  // =====================================================
  async update(id: string, payload: GalleryUpdateDto): Promise<Gallery> {
    const data: Prisma.galleryUpdateInput = {};

    // Mappage des champs scalaires (PATCH)
    if (payload.url !== undefined) data.url = payload.url;
    if (payload.label !== undefined) data.label = payload.label;

    const gallery = await prisma.gallery.update({
      where: { gallery_id: id },
      data: {
        ...data,
        // CORRECTION N-N: Utilisation de la clé composite content_id_gallery_id
        content_gallery: payload.connect?.content_gallery
            ? { 
                connect: payload.connect.content_gallery.map(cg => ({
                    content_id_gallery_id: { content_id: cg.content_id, gallery_id: id }
                })) 
            }
            : payload.set?.content_gallery
                ? { 
                    set: payload.set.content_gallery.map(cg => ({
                        content_id_gallery_id: { content_id: cg.content_id, gallery_id: id }
                    })) 
                }
                : undefined,
      },
      include: {
        content_gallery: true,
      }
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
