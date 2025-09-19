import { LoginRequest, LoginResponse } from '@/types';
import { setIsAuthenticated } from '@/stores/authStore';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

export class AuthService {
  static async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Login failed: ${response.status}`);
    }

    const data = await response.json();
    this.setToken(data.token);
    setIsAuthenticated(true);
    return data;
  }

  static getAuthHeader(): HeadersInit {
    const token = localStorage.getItem('auth_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  static setToken(token: string): void {
    localStorage.setItem('auth_token', token);
  }

  static removeToken(): void {
    localStorage.removeItem('auth_token');
    setIsAuthenticated(false);
  }

  static getToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  static isTokenValid(): boolean {
    return !!this.getToken();
  }
}