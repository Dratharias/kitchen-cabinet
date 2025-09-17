import Fastify from "fastify";
import { fastifyCors } from "@fastify/cors";
import { PORT } from "./config.js";
import createRoutes from "routes/index.js";

const fastify = Fastify({ logger: true });

fastify.register(fastifyCors, {
  origin: "*",
});
await fastify.register(createRoutes);

await fastify.listen({ port: PORT, host: '0.0.0.0' });
console.log(`🚀 Fastify server running at http://localhost:${PORT}`);
