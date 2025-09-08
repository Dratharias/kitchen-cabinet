import Fastify from "fastify";
import cors from "@fastify/cors";
import createRoutes from "./routes";
import { PORT } from "../config";

const fastify = Fastify({ logger: true });

await fastify.register(cors, { origin: true });
await fastify.register(createRoutes);

fastify.listen({ port: PORT }).then(() => {
  console.log(`Fastify server running at http://localhost:${PORT}`);
});
