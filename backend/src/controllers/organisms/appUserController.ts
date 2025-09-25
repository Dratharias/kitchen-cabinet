import { prisma } from "../../config.js";
import { GenericController } from "types/crud.types.js";
import { UserRoleData } from "types/db.types.js";
import { UserCreateDto, UserUpdateDto } from "types/dto.types.js";
import { v4 as uuidv4 } from "uuid";

export class AppUserController
  implements GenericController<UserUpdateDto, UserCreateDto, UserUpdateDto>
{
  // Crée un utilisateur et retourne uniquement les champs de lecture (pas le password)
  async create(payload: UserCreateDto): Promise<UserUpdateDto> {
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

  // Find est optionnel mais ici fourni pour compléter l'interface
  async findById(id: string): Promise<UserUpdateDto | null> {
    const user = await prisma.app_user.findUnique({ where: { user_id: id } });
    return user
      ? { username: user.username, role: user.role as UserRoleData }
      : null;
  }

  async findAll(): Promise<UserUpdateDto[]> {
    const users = await prisma.app_user.findMany();
    return users.map((u) => ({
      username: u.username,
      role: u.role as UserRoleData,
    }));
  }

  async update(
    id: string,
    payload: Partial<UserCreateDto & UserUpdateDto>,
  ): Promise<UserUpdateDto> {
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
