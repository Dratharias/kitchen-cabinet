import { PrismaClient } from "@prisma/client";
import { GenericController } from "types/crud.types";
import { UserUpsert, UserRead } from "types/controller.types";
import { UserRoleData } from "types/db.types";
import { v4 as uuidv4 } from "uuid";

const prisma = new PrismaClient();

export class AppUserController
  implements GenericController<UserRead, UserUpsert, UserUpsert>
{
  async create(payload: UserUpsert): Promise<UserRead> {
    const user = await prisma.app_user.create({
      data: {
        user_id: uuidv4(),
        username: payload.username,
        password: payload.password,
        role: payload.role,
      },
    });
    return { username: user.username, role: user.role as UserRoleData };
  }

  async findById(id: string): Promise<UserRead | null> {
    const user = await prisma.app_user.findUnique({ where: { user_id: id } });
    return user ? { username: user.username, role: user.role as UserRoleData } : null;
  }

  async findAll(): Promise<UserRead[]> {
    const users = await prisma.app_user.findMany();
    return users.map((u) => ({ username: u.username, role: u.role as UserRoleData }));
  }

  async update(id: string, payload: UserUpsert): Promise<UserRead> {
    const user = await prisma.app_user.update({
      where: { user_id: id },
      data: payload,
    });
    return { username: user.username, role: user.role as UserRoleData };
  }

  async delete(id: string): Promise<{ deleted: boolean }> {
    await prisma.app_user.delete({ where: { user_id: id } });
    return { deleted: true };
  }
}
