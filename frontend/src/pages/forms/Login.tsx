import { useState } from "react";
import { useAuthStore } from "@/stores/authStore";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/atoms/Button";
import { Input } from "@/components/ui/atoms/Input";
import { AuthService } from "@/services/auth";
import { Span } from "@/components/ui/atoms/Span";

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
        <div className="flex flex-col items-center space-y-4">
          <p className="text-lg font-semibold">
            <Span className="text-primary">
              Bienvenue {AuthService.getUser()?.username ?? "Utilisateur"}
            </Span>
          </p>
          <Button onClick={logout}>Logout</Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
          <h2 className="text-xl font-bold mb-4">Login</h2>

          <label className="block text-sm font-medium">
            Username
            <Input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="mt-1"
            />
          </label>

          <label className="block text-sm font-medium">
            Password
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="mt-1"
            />
          </label>

          <Button type="submit" disabled={loading}>
            {loading ? "Connexion..." : "Login"}
          </Button>
        </form>
      )}
    </div>
  );
}
