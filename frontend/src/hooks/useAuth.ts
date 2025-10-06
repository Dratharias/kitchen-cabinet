import { useAuthStore } from "@/stores/authStore";
import { AuthService } from "@/services/auth";
import type { LoginRequest } from "@/types/auth";

export function useAuth() {
  const { setAuth, refreshAuthState } = useAuthStore();

  const login = async (username: string, password: string) => {
    const credentials: LoginRequest = { username, password };
    const response = await AuthService.login(credentials);

    if (response?.token) {
      setAuth(true, { username: response.username, role: response.role });
    } else {
      setAuth(false, null);
    }
  };

  const logout = () => {
    AuthService.logout();
    setAuth(false, null);
    refreshAuthState();
  };

  return { login, logout };
}
