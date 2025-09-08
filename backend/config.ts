import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '.env') });

export const PORT: number = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
export const DATABASE_URL: string = process.env.DATABASE_URL || '';
