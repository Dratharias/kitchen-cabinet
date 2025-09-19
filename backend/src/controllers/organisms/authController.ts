import { FastifyRequest, FastifyReply } from "fastify";
import { prisma } from "../../config.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "supersecret";

const funny401Messages = [
  "Not this time",
  "Access denied, try again later",
  "You shall not pass 🧙‍♂️",
  "Nope. Not today",
  "Nice try, but no",
  "401: Fun police caught you",
  "Oops! Wrong turn",
  "Hold your horses, friend",
  "Denied! Because reasons",
  "Access forbidden – stay curious"
];


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


// Stockage en mémoire des tentatives
const attemptCache: Record<string, { count: number; lastAttempt: number }> = {};
const MAX_ATTEMPTS = 5;
const BLOCK_DURATION_MS = 15 * 60 * 1000; // 15 minutes

export async function authGuard(req: FastifyRequest, reply: FastifyReply) {
  const ip = req.ip;
  const now = Date.now();

  const attempt = attemptCache[ip];
  if (attempt && attempt.count >= MAX_ATTEMPTS && now - attempt.lastAttempt < BLOCK_DURATION_MS)
    return reply.status(429).send({ error: "Too many attempts, get lost!" });

  const authHeader = req.headers.authorization;
  const token = authHeader?.replace("Bearer ", "");

  try {
    const payload = jwt.verify(token ?? "", JWT_SECRET) as { userId: string; role: string };
    
    // Verify user still exists in database
    const user = await prisma.app_user.findUnique({ where: { user_id: payload.userId } });
    
    if (!user) return reply.status(401).send({ error: funny401Messages[Math.floor(Math.random() * funny401Messages.length)] });

    (req as any).user = payload;
    if (attemptCache[ip]) delete attemptCache[ip];
  } catch (err) {

    !attemptCache[ip]
      ? attemptCache[ip] = { count: 1, lastAttempt: now }
      : (attemptCache[ip].count++, attemptCache[ip].lastAttempt = now);

    return reply.status(401).send({ error: funny401Messages[Math.floor(Math.random() * funny401Messages.length)] });
  }
}