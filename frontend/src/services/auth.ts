import type { LoginRequest, LoginResponse } from "@/types/auth";

const TOKEN_KEY = "auth_token";
const USER_KEY = "auth_user";
const API_URL = import.meta.env.VITE_API_URL;

export class AuthService {
  static async login(credentials: LoginRequest): Promise<LoginResponse | null> {
    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
      });

      if (!res.ok) throw new Error("Login failed");

      const data: LoginResponse = await res.json();
      if (data?.token) {
        localStorage.setItem(TOKEN_KEY, data.token);
        localStorage.setItem(
          USER_KEY,
          JSON.stringify({ username: data.username, role: data.role })
        );
      }
      return data;
    } catch (err) {
      console.error("AuthService.login error:", err);
      return null;
    }
  }

  static logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }

  static isTokenValid(): boolean {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return false;

    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      if (!payload.exp) return false;
      const exp = payload.exp * 1000;
      return Date.now() < exp;
    } catch {
      return false;
    }
  }

  static getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  static getUser(): { username: string; role: string } | null {
    const user = localStorage.getItem(USER_KEY);
    return user ? JSON.parse(user) : null;
  }
}
