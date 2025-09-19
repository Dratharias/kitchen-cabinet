import { useNavigate } from "@solidjs/router";
import { toast } from "solid-toast";
import { AuthService } from '@/services/auth';

export function useAuth() {
  const navigate = useNavigate();

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      await AuthService.login({ username, password });
      toast.success("Authentification réussie !");
      return true;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Identifiants incorrects");
      return false;
    }
  };

  const logout = () => {
    AuthService.removeToken();
    toast.success("Déconnexion réussie !");
    navigate("/login", { replace: true });
  };

  return { login, logout };
}