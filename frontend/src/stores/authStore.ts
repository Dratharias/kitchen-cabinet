import { createSignal } from "solid-js";
import { AuthService } from "@/services/auth";

export const [isAuthenticated, setIsAuthenticated] = createSignal(
  AuthService.isTokenValid(),
);

export const [currentUser, setCurrentUser] = createSignal<{
  username: string;
  role: string;
} | null>(AuthService.getUser());

// helper pour resynchroniser avec localStorage
export function refreshAuthState() {
  setIsAuthenticated(AuthService.isTokenValid());
  setCurrentUser(AuthService.getUser());
}
