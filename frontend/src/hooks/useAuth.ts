import { setIsAuthenticated, setCurrentUser } from "@/stores/authStore";
import { AuthService } from "@/services/auth";
import type { LoginRequest } from "@/types/auth";

export function useAuth() {
  const login = async (username: string, password: string) => {
    const credentials: LoginRequest = { username, password };
    const response = await AuthService.login(credentials);

    if (response?.token) {
      setIsAuthenticated(true);
      setCurrentUser({ username: response.username, role: response.role });
    }
  };

  const logout = () => {
    AuthService.logout();
    setIsAuthenticated(false);
    setCurrentUser(null);
  };

  return { login, logout };
}
