import { PaginatedResponse } from "./common";

export interface User {
  user_id: string;
  username: string;
  role: string;
  created_at: string;
}

export type ListUsersResponse = PaginatedResponse<User>;
export type GetUserResponse = User;
export type CreateUserRequest = {
  username: string;
  password: string;
  role?: string;
};
export type CreateUserResponse = User;
export type UpdateUserRequest = Partial<Omit<User, "user_id" | "created_at">>;
export type UpdateUserResponse = User;
export type DeleteUserResponse = { success: boolean };
