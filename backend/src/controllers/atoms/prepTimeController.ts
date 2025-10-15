import { prisma } from "../../config.js";
import { GenericController } from "types/crud.types.js";
import { Category, PrepTime } from "types/controller.types.js";
import { PrepTimeCreateDto, PrepTimeUpdateDto, PrepTimeConnect } from "types/dto.types.js";
import { v4 as uuidv4 } from "uuid";

export const normalizePrepTime = (prepTime: any): PrepTime => ({
  prep_time_id: prepTime.prep_time_id,
  duration: prepTime.duration,
  style_id: prepTime.style_id,

  style: prepTime.style ?? null,
  content_prep_times: prepTime.content_prep_times ?? null,
  segment_prep_time: prepTime.segment_prep_time ?? null,
});

export class PrepTimeController
  implements
    GenericController<
      PrepTime,
      Omit<PrepTime, "style" | "content_prep_times" | "segment_prep_time">,
      {
        style: Category | null;
        content_prep_times: any[] | null;
        segment_prep_time: any[] | null;
      },
      PrepTimeConnect,
      PrepTimeConnect
    >
{
  async create(
    payload: Omit<
      PrepTime,
      "style" | "content_prep_times" | "segment_prep_time"
    > & { connect?: PrepTimeCreateDto["connect"] },
  ): Promise<PrepTime> {
    const newId = uuidv4();
    
    // Gérer la connexion N-1 (style)
    const style_id = payload.connect?.style?.[0]?.category_id ?? payload.style_id;

    const prepTime = await prisma.prep_time.create({
      data: {
        prep_time_id: newId,
        duration: payload.duration,
        style_id: style_id, 

        // Relations N-N (Content)
        content_prep_times: payload.connect?.content_prep_times
          ? {
              connect: payload.connect.content_prep_times.map((c) => ({
                content_id_prep_time_id: {
                  prep_time_id: newId,
                  content_id: c.content_id,
                },
              })),
            }
          : undefined,

        // Relations N-N (Segment)
        segment_prep_time: payload.connect?.segment_prep_time
          ? {
              connect: payload.connect.segment_prep_time.map((s) => ({
                segment_id_prep_time_id: {
                  prep_time_id: newId,
                  segment_id: s.segment_id,
                },
              })),
            }
          : undefined,
      },
      include: {
        style: true,
        content_prep_times: true,
        segment_prep_time: true,
      },
    });

    return normalizePrepTime(prepTime);
  }

  async findById(id: string): Promise<PrepTime | null> {
    const prepTime = await prisma.prep_time.findUnique({
      where: { prep_time_id: id },
      include: {
        style: true,
        content_prep_times: true,
        segment_prep_time: true,
      },
    });
    return prepTime ? normalizePrepTime(prepTime) : null;
  }

  async findAll(): Promise<PrepTime[]> {
    const prepTimes = await prisma.prep_time.findMany({
      include: {
        style: true,
        content_prep_times: true,
        segment_prep_time: true,
      },
    });
    return prepTimes.map(normalizePrepTime);
  }

  async update(id: string, payload: PrepTimeUpdateDto): Promise<PrepTime> {
    
    // Gérer la connexion N-1 (style)
    const style_id = payload.connect?.style?.[0]?.category_id ?? payload.style_id;

    const prepTime = await prisma.prep_time.update({
      where: { prep_time_id: id },
      data: {
        duration: payload.duration,
        style_id: style_id, // Mise à jour de la FK

        // Relations N-N (Content)
        content_prep_times: payload.connect?.content_prep_times
          ? {
              connect: payload.connect.content_prep_times.map((c) => ({
                content_id_prep_time_id: {
                  prep_time_id: id,
                  content_id: c.content_id,
                },
              })),
            }
          : payload.set?.content_prep_times
            ? {
                set: payload.set.content_prep_times.map((c) => ({
                  content_id_prep_time_id: {
                    prep_time_id: id,
                    content_id: c.content_id,
                  },
                })),
              }
            : undefined,

        // Relations N-N (Segment)
        segment_prep_time: payload.connect?.segment_prep_time
          ? {
              connect: payload.connect.segment_prep_time.map((s) => ({
                segment_id_prep_time_id: {
                  prep_time_id: id,
                  segment_id: s.segment_id,
                },
              })),
            }
          : payload.set?.segment_prep_time
            ? {
                set: payload.set.segment_prep_time.map((s) => ({
                  segment_id_prep_time_id: {
                    prep_time_id: id,
                    segment_id: s.segment_id,
                  },
                })),
              }
            : undefined,
      },
      include: {
        style: true,
        content_prep_times: true,
        segment_prep_time: true,
      },
    });

    return normalizePrepTime(prepTime);
  }

  async delete(id: string): Promise<{ deleted: boolean }> {
    await prisma.prep_time.delete({ where: { prep_time_id: id } });
    return { deleted: true };
  }
}
