import { v4 as uuidv4 } from "uuid";
import type { PrismaClient } from "@prisma/client";

export const DEV_MODE = process.env.NODE_ENV !== "production";

/**
 * Custom error class for better context during orchestration failures.
 */
export class OrchestratorError extends Error {
  context: string;
  path?: string;
  payload?: unknown;

  constructor(
    message: string,
    context: string,
    path?: string,
    payload?: unknown,
  ) {
    super(message);
    this.name = "OrchestratorError";
    this.context = context;
    this.path = path;
    this.payload = payload;
  }
}

/**
 * Centralized error logger for consistent output.
 */
export function logError(
  context: string,
  error: any,
  extra?: Record<string, unknown>,
) {
  console.error(`[Orchestrator] ${context} failed:`, {
    name: error?.name,
    message: error?.message,
    ...(DEV_MODE && { stack: error?.stack, extra }),
  });
}

/**
 * Assertion utility to enforce conditions and throw contextual errors.
 */
export function assert(
  condition: any,
  message: string,
  context: string,
  path?: string,
  payload?: unknown,
): asserts condition {
  if (!condition) {
    throw new OrchestratorError(message, context, path, payload);
  }
}

/**
 * Ensures a unique ID, generating a new one if the candidate already exists.
 */
export async function safeId(
  tx: PrismaClient,
  table: keyof PrismaClient,
  idField: string,
  candidateId?: string,
): Promise<string> {
  if (!candidateId) return uuidv4();
  const exists = await (tx[table] as any).findUnique({
    where: { [idField]: candidateId },
  });
  return exists ? uuidv4() : candidateId;
}
