import { useState } from "react";
import { useAuthStore } from "@/stores/authStore";
import { useAuth } from "@/hooks/useAuth";
import { AuthService } from "@/services/auth";

export function LoginForm() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const { isAuthenticated } = useAuthStore();
  const { login, logout } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await login(username, password);
    setLoading(false);
  };

  return (
    <div className="flex items-center justify-center min-h-[70vh] w-full text-prim-txt dark:text-prim-txt-d">
      {isAuthenticated ? (
        <div className="flex flex-col items-center space-y-4"></div>
      ) : (
        <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
          <h2 className="text-xl font-bold mb-4">Login</h2>
        </form>
      )}
    </div>
  );
}
