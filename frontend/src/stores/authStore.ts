import { createSignal, createEffect } from "solid-js";
import { AuthService } from "@/services/auth";

export const [isAuthenticated, setIsAuthenticated] = createSignal(
  AuthService.isTokenValid(),
);

export const [currentUser, setCurrentUser] = createSignal<{
  username: string;
  role: string;
} | null>(AuthService.getUser());

// Keep store synced with localStorage + token state
export function refreshAuthState() {
  const valid = AuthService.isTokenValid();
  setIsAuthenticated(valid);
  setCurrentUser(valid ? AuthService.getUser() : null);
}

// Auto-check token validity on every render cycle
createEffect(() => {
  const valid = AuthService.isTokenValid();
  if (!valid && isAuthenticated()) {
    // Auto logout if token expired/invalid
    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_user");
    setIsAuthenticated(false);
    setCurrentUser(null);
  }
});
