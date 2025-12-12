import { PrismaClient } from "@prisma/client";
import { v4 as uuidv4 } from "uuid";

/**
 * Generate a safe UUID, checking for uniqueness in the database
 */
export async function safeId(
  prisma: PrismaClient,
  table: string,
  field: string,
  providedId?: string
): Promise<string> {
  if (providedId) {
    // Validate the provided ID exists
    const exists = await (prisma as any)[table].findUnique({
      where: { [field]: providedId },
    });
    if (exists) {
      throw new Error(
        `${table}.${field} "${providedId}" already exists. Cannot create duplicate.`
      );
    }
    return providedId;
  }

  // Generate new UUID
  let id = uuidv4();
  let attempts = 0;
  const maxAttempts = 5;

  while (attempts < maxAttempts) {
    const exists = await (prisma as any)[table].findUnique({
      where: { [field]: id },
    });
    if (!exists) return id;
    id = uuidv4();
    attempts++;
  }

  throw new Error(`Failed to generate unique ${table}.${field} after ${maxAttempts} attempts`);
}

/**
 * Assert a condition, throwing an error if false
 */
export function assert(
  condition: any,
  message: string,
  context?: string,
  field?: string,
  data?: any
): asserts condition {
  if (!condition) {
    const error = context ? `[${context}] ${message}` : message;
    if (field && data) {
      console.error(`${error}. Field: ${field}, Data:`, data);
    }
    throw new Error(error);
  }
}

/**
 * Create a slug from a string
 */
export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-") // Replace spaces with -
    .replace(/[^\w\-]+/g, "") // Remove all non-word chars
    .replace(/\-\-+/g, "-") // Replace multiple - with single -
    .replace(/^-+/, "") // Trim - from start of text
    .replace(/-+$/, ""); // Trim - from end of text
}

/**
 * Parse pagination params from query
 */
export function parsePagination(query: any) {
  const page = parseInt(query.page) || 1;
  const limit = Math.min(parseInt(query.limit) || 12, 100); // Max 100
  const skip = (page - 1) * limit;

  return { page, limit, skip, take: limit };
}

/**
 * Parse sort params from query
 */
export function parseSort(query: any, defaultField = "date_created") {
  const sortBy = query.sortBy || defaultField;
  const order = query.order === "desc" ? "desc" : "asc";

  return { sortBy, order };
}

/**
 * Build pagination response
 */
export function buildPaginationResponse(
  total: number,
  page: number,
  limit: number
) {
  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  };
}
