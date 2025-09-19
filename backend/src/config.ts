import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

export const PORT: number = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;
export const DATABASE_URL: string = process.env.DATABASE_URL || '';

class DatabaseClient {
  private static instance: PrismaClient | null = null;

  static getInstance(): PrismaClient {
    if (!DatabaseClient.instance) {
      DatabaseClient.instance = new PrismaClient({
        datasources: {
          db: {
            url: DATABASE_URL
          }
        }
      });
    }
    return DatabaseClient.instance;
  }

  static async disconnect(): Promise<void> {
    if (DatabaseClient.instance) {
      await DatabaseClient.instance.$disconnect();
      DatabaseClient.instance = null;
    }
  }
}

export const prisma = DatabaseClient.getInstance();