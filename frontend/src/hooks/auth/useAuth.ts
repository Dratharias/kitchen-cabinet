import { useAuthStore } from "@/stores/authStore";
import { AuthService } from "@/services/auth";
import type { LoginRequest } from "@/types/auth";

export function useAuth() {
  const { setAuth, refreshAuthState } = useAuthStore();

  const login = async (
    username: string,
    password: string,
  ): Promise<boolean> => {
    const credentials: LoginRequest = { username, password };
    const response = await AuthService.login(credentials);

    if (response?.token) {
      setAuth(true, { username: response.username, role: response.role });
      return true;
    } else {
      setAuth(false, null);
      return false;
    }
  };

  const logout = () => {
    AuthService.logout();
    setAuth(false, null);
    refreshAuthState();
  };

  return { login, logout };
}
