import { FastifyRequest, FastifyReply } from "fastify";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "supersecret";

export async function loginHandler(req:any, reply:any) {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return reply.status(400).send({ error: "Missing credentials" });
    }

    const user = await prisma.app_user.findUnique({ where: { username } });
    if (!user) return reply.status(401).send({ error: "Invalid username or password" });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return reply.status(401).send({ error: "Invalid username or password" });

    const token = jwt.sign({ userId: user.user_id, role: user.role }, JWT_SECRET, { expiresIn: "8h" });
    return reply.send({ username: user.username, role: user.role, token });

  } catch (err) {
    console.error("LoginHandler Error:", err);
    return reply.status(500).send({ error: "Internal server error" });
  }
}


// Middleware pour protéger les routes
export async function authGuard(req: FastifyRequest, reply: FastifyReply) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) throw new Error("Missing token");

    const token = authHeader.replace("Bearer ", "");
    const payload = jwt.verify(token, JWT_SECRET) as { userId: string; role: string };
    (req as any).user = payload; // injecte info user dans req
  } catch (e) {
    reply.status(401).send({ error: "Unauthorized" });
  }
}
