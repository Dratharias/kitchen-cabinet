import { createSignal } from "solid-js";
import { AuthService } from "@/services/auth";

// état de connexion
export const [isAuthenticated, setIsAuthenticated] = createSignal(
  AuthService.isTokenValid()
);

// utilisateur courant (username + role)
export const [currentUser, setCurrentUser] = createSignal<{ username: string; role: string } | null>(
  AuthService.getUser()
);
