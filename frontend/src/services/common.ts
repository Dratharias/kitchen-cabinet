import { API_BASE } from "@/config/api";
import { PaginatedRequest } from "@/types";

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public response?: any,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export class CommonService {
  /** Construit les paramètres de requête ?key=value&... */
  static buildQueryParams(
    params: Partial<PaginatedRequest> & Record<string, any>,
  ): string {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (typeof value === "object") {
          searchParams.append(key, JSON.stringify(value));
        } else {
          searchParams.append(key, String(value));
        }
      }
    });
    return searchParams.toString();
  }

  /** Gestion d’erreur HTTP */
  static async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new ApiError(
        errorData.error || `Request failed: ${response.status}`, // Correction: Utilise errorData.error
        response.status,
        errorData,
      );
    }
    return response.json();
  }

  /** En-têtes par défaut (auth facultative) */
  static getDefaultHeaders(includeAuth = false): HeadersInit {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };

    if (includeAuth) {
      const token = localStorage.getItem("auth_token");
      if (token) headers.Authorization = `Bearer ${token}`;
    }

    return headers;
  }

  /** GET */
  static async get<T>(
    endpoint: string,
    params?: Record<string, any>,
    includeAuth = false,
  ): Promise<T> {
    const queryString = params ? `?${this.buildQueryParams(params)}` : "";
    const response = await fetch(`${API_BASE}${endpoint}${queryString}`, {
      method: "GET",
      headers: this.getDefaultHeaders(includeAuth),
    });
    return this.handleResponse<T>(response);
  }

  /** POST */
  static async post<T>(
    endpoint: string,
    data: any,
    includeAuth = false,
  ): Promise<T> {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      method: "POST",
      headers: this.getDefaultHeaders(includeAuth),
      body: JSON.stringify(data),
    });
    return this.handleResponse<T>(response);
  }

  /** PUT — ajoutée pour les updates génériques */
  static async put<T>(
    endpoint: string,
    data: any,
    includeAuth = false,
  ): Promise<T> {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      method: "PUT",
      headers: this.getDefaultHeaders(includeAuth),
      body: JSON.stringify(data),
    });
    return this.handleResponse<T>(response);
  }

  /** PATCH — ajoutée pour les mises à jour atomiques */
  static async patch<T>(
    endpoint: string,
    data: any,
    includeAuth = false,
  ): Promise<T> {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      method: "PATCH",
      headers: this.getDefaultHeaders(includeAuth),
      body: JSON.stringify(data),
    });
    return this.handleResponse<T>(response);
  }

  /** DELETE — utile pour ressources simples */
  static async delete<T>(endpoint: string, includeAuth = false): Promise<T> {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      method: "DELETE",
      headers: this.getDefaultHeaders(includeAuth),
    });
    return this.handleResponse<T>(response);
  }
}
