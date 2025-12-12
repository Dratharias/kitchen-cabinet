import Fastify from 'fastify';
import cors from '@fastify/cors';
import { aiRouter } from './routes/ai.js';
import { healthRouter } from './routes/health.js';

const fastify = Fastify({
  logger: {
    level: process.env.NODE_ENV === 'development' ? 'info' : 'error',
  },
});

// Register CORS
await fastify.register(cors, {
  origin: true, // Allow all origins in development
  credentials: true,
});

// Register routes
await fastify.register(healthRouter, { prefix: '/api' });
await fastify.register(aiRouter, { prefix: '/api/ai' });

// Start server
const start = async () => {
  try {
    const port = process.env.PORT || 3002;
    await fastify.listen({ port, host: '0.0.0.0' });
    console.log(`🤖 AI Service running on port ${port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
