import Fastify from "fastify";
import { fastifyCors } from "@fastify/cors";
import { PORT } from "./config.js";
import createRoutes from "./routes/index.js";

const fastify = Fastify({ logger: true });

fastify.register(fastifyCors, {
  origin: ["http://localhost:3000", "http://172.18.0.2:3000"],
});
await fastify.register(createRoutes);

console.log(fastify.printRoutes());

await fastify.listen({ port: PORT, host: "0.0.0.0" });
console.log(`🚀 Fastify server running at http://localhost:${PORT}`);
