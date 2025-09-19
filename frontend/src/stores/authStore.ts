import { createSignal } from "solid-js";
import { AuthService } from '@/services/auth';

export const [isAuthenticated, setIsAuthenticated] = createSignal(
  AuthService.isTokenValid()
);