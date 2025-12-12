import { FastifyRequest, FastifyReply } from "fastify";
import fs from "fs/promises";
import path from "path";

const IMAGES_DIR = path.join(process.cwd(), "public", "images");

export class ImagesController {
  /**
   * List all images in the images directory
   */
  async listImages(request: FastifyRequest, reply: FastifyReply) {
    try {
      // Ensure directory exists
      await fs.mkdir(IMAGES_DIR, { recursive: true });

      const files = await fs.readdir(IMAGES_DIR);

      // Filter for image files only
      const imageExtensions = [".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg"];
      const images = files.filter((file) =>
        imageExtensions.some((ext) => file.toLowerCase().endsWith(ext))
      );

      // Check if default.png exists
      const hasDefault = images.includes("default.png");

      return reply.send({
        success: true,
        data: {
          images: images.map((name) => ({
            name,
            url: `/images/${name}`,
            isDefault: name === "default.png",
          })),
          hasDefault,
          count: images.length,
        },
      });
    } catch (error: any) {
      console.error("List images error:", error);
      return reply.code(500).send({
        success: false,
        error: "Failed to list images",
      });
    }
  }

  /**
   * Get image file info
   */
  async getImageInfo(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { filename } = request.params as { filename: string };
      const filePath = path.join(IMAGES_DIR, filename);

      // Security: prevent directory traversal
      if (!filePath.startsWith(IMAGES_DIR)) {
        return reply.code(403).send({
          success: false,
          error: "Access denied",
        });
      }

      const stats = await fs.stat(filePath);

      return reply.send({
        success: true,
        data: {
          name: filename,
          size: stats.size,
          url: `/images/${filename}`,
          modified: stats.mtime,
        },
      });
    } catch (error: any) {
      if (error.code === "ENOENT") {
        return reply.code(404).send({
          success: false,
          error: "Image not found",
        });
      }
      console.error("Get image info error:", error);
      return reply.code(500).send({
        success: false,
        error: "Failed to get image info",
      });
    }
  }
}
