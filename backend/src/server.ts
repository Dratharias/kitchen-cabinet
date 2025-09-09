import Fastify from "fastify";
import { fastifyCors } from "@fastify/cors";
import createRoutes from "./routes.js";
import { PORT } from "./config.js";

const fastify = Fastify({ logger: true });

fastify.register(fastifyCors, {
  origin: "*",
});
await fastify.register(createRoutes);

await fastify.listen({ port: PORT, host: '0.0.0.0' });
console.log(`🚀 Fastify server running at http://localhost:${PORT}`);
