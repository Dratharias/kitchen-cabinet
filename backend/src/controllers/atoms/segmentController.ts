import { PrismaClient } from "@prisma/client";
import { GenericController } from "types/crud.types.js";
import { SegmentCore, SegmentRelations, Segment } from "types/controller.types.js";
import { SegmentCreateDto, SegmentUpdateDto } from "types/dto.types.js";
import { v4 as uuidv4 } from "uuid";

const prisma = new PrismaClient();

export const normalizeSegment = (segment: any): Segment => ({
  segment_id: segment.segment_id,
  title: segment.title,
  paragraph: segment.paragraph,
  order_num: segment.order_num,

  content_segments: segment.content_segments ?? null,
  segment_prep_time: segment.segment_prep_time ?? null,
});

export class SegmentController
  implements GenericController<Segment, SegmentCore, SegmentRelations>
{
  async create(payload: SegmentCore & { connect?: SegmentCreateDto["connect"] }): Promise<Segment> {
    const newId = uuidv4();
    const segment = await prisma.segment.create({
      data: {
        segment_id: newId,
        title: payload.title,
        paragraph: payload.paragraph,
        order_num: payload.order_num,

        content_segments: payload.connect?.content_segments 
          ? {
              connect: payload.connect.content_segments.map((c) => ({
                content_id_segment_id: {
                  content_id: c.content_id,
                  segment_id: newId,
                },
              })),
            }
          : undefined,

        segment_prep_time: payload.connect?.segment_prep_time
          ? {
              connect: payload.connect.segment_prep_time.map((p) => ({
                segment_id_prep_time_id: {
                  segment_id: newId,
                  prep_time_id: p.prep_time_id,
                },
              })),
            }
          : undefined,
      },
      include: {
        content_segments: true,
        segment_prep_time: true,
      },
    });

    return normalizeSegment(segment);
  }

  async findById(id: string): Promise<Segment | null> {
    const segment = await prisma.segment.findUnique({
      where: { segment_id: id },
      include: {
        content_segments: true,
        segment_prep_time: true,
      },
    });
    return segment ? normalizeSegment(segment) : null;
  }

  async findAll(): Promise<Segment[]> {
    const segments = await prisma.segment.findMany({
      include: {
        content_segments: true,
        segment_prep_time: true,
      },
    });
    return segments.map(normalizeSegment);
  }

  async update(id: string, payload: SegmentUpdateDto): Promise<Segment> {
    const segment = await prisma.segment.update({
      where: { segment_id: id },
      data: {
        title: payload.title,
        paragraph: payload.paragraph,
        order_num: payload.order_num,

        content_segments: payload.connect?.content_segments
          ? {
              connect: payload.connect.content_segments.map((c) => ({
                content_id_segment_id: {
                  content_id: c.content_id,
                  segment_id: id,
                },
              })),
            }
          : payload.set?.content_segments
          ? {
              set: payload.set.content_segments.map((c) => ({
                content_id_segment_id: {
                  content_id: c.content_id,
                  segment_id: id,
                },
              })),
            }
          : undefined,

        segment_prep_time: payload.connect?.segment_prep_time
          ? {
              connect: payload.connect.segment_prep_time.map((p) => ({
                segment_id_prep_time_id: {
                  segment_id: id,
                  prep_time_id: p.prep_time_id,
                },
              })),
            }
          : payload.set?.segment_prep_time
          ? {
              set: payload.set.segment_prep_time.map((p) => ({
                segment_id_prep_time_id: {
                  segment_id: id,
                  prep_time_id: p.prep_time_id,
                },
              })),
            }
          : undefined,
      },
      include: {
        content_segments: true,
        segment_prep_time: true,
      },
    });

    return normalizeSegment(segment);
  }

  async delete(id: string): Promise<{ deleted: boolean }> {
    await prisma.segment.delete({ where: { segment_id: id } });
    return { deleted: true };
  }
}