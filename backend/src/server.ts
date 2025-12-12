import Fastify from "fastify";
import { fastifyCors } from "@fastify/cors";
import fastifyStatic from "@fastify/static";
import path from "path";
import { PORT } from "./config.js";
import { registerRoutes } from "./routes/index.js";

async function start() {
  const fastify = Fastify({ logger: true });

  fastify.register(fastifyCors, {
    origin: ["http://localhost:3000", "http://172.18.0.2:3000"],
  });

  // Serve static images
  fastify.register(fastifyStatic, {
    root: path.join(process.cwd(), "public"),
    prefix: "/",
  });

  await registerRoutes(fastify);

  console.log(fastify.printRoutes());

  await fastify.listen({ port: PORT, host: "0.0.0.0" });
  console.log(`🚀 Fastify server running at http://localhost:${PORT}`);
}

start().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
