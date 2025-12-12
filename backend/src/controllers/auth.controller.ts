import { FastifyRequest, FastifyReply } from "fastify";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import type { LoginRequest, LoginResponse, JWTPayload } from "../types/index.js";

const prisma = new PrismaClient();

export class AuthController {
  async login(
    request: FastifyRequest<{ Body: LoginRequest }>,
    reply: FastifyReply
  ) {
    try {
      const { username, password } = request.body;

      if (!username || !password) {
        return reply.code(400).send({
          success: false,
          error: "Username and password are required",
        });
      }

      // Find user
      const user = await prisma.app_user.findUnique({
        where: { username },
      });

      if (!user) {
        return reply.code(401).send({
          success: false,
          error: "Invalid credentials",
        });
      }

      // Verify password
      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return reply.code(401).send({
          success: false,
          error: "Invalid credentials",
        });
      }

      // Generate JWT
      const payload: JWTPayload = {
        userId: user.user_id,
        username: user.username,
        role: user.role,
      };

      const token = jwt.sign(payload, process.env.JWT_SECRET!, {
        expiresIn: "7d",
      });

      const response: LoginResponse = {
        username: user.username,
        role: user.role,
        token,
      };

      return reply.send({
        success: true,
        data: response,
      });
    } catch (error: any) {
      console.error("Login error:", error);
      return reply.code(500).send({
        success: false,
        error: "Internal server error",
      });
    }
  }

  async verify(request: FastifyRequest, reply: FastifyReply) {
    try {
      const authHeader = request.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return reply.code(401).send({
          success: false,
          error: "No token provided",
        });
      }

      const token = authHeader.substring(7);
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;

      return reply.send({
        success: true,
        data: {
          userId: decoded.userId,
          username: decoded.username,
          role: decoded.role,
        },
      });
    } catch (error) {
      return reply.code(401).send({
        success: false,
        error: "Invalid token",
      });
    }
  }
}
