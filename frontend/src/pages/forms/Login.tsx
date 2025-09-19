import { createSignal } from "solid-js";
import { isAuthenticated } from "@/stores/authStore";
import { useAuth } from "@/hooks/useAuth";
import Button from "@/components/ui/atoms/Button";
import Input from "@/components/ui/atoms/Input";
import { Span } from "@/components/ui/atoms/Span";

export function LoginForm() {
  const [username, setUsername] = createSignal("");
  const [password, setPassword] = createSignal("");
  const [loading, setLoading] = createSignal(false);
  
  const { login, logout } = useAuth();

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    setLoading(true);
    await login(username(), password());
    setLoading(false);
  };

  const handleLogout = () => {
    logout();
    setUsername("");
    setPassword("");
  };

  return (
    <div class="flex items-center text-center justify-center min-h-[70vh] w-full text-prim-txt dark:text-prim-txt-d">
      {isAuthenticated() ? (
        <div>
          <h2 class="pl-4 text-xl font-bold mb-4">
            Bienvenue {username()} 🎉
          </h2>
          <Span class="mx-auto">
            Vous êtes connecté avec succès.
          </Span>
          <Button class="mx-auto mt-4" onClick={handleLogout}>
            Logout
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} class="w-full max-w-sm space-y-4">
          <h2 class="text-xl font-bold mb-4">
            Login
          </h2>
          <label class="block text-sm font-medium">
            Username
            <Input
              type="text"
              value={username()}
              onInput={(e) => setUsername(e.currentTarget.value)}
              required
              class="mt-1"
            />
          </label>
          <label class="block text-sm font-medium">
            Password
            <Input
              type="password"
              value={password()}
              onInput={(e) => setPassword(e.currentTarget.value)}
              required
              class="mt-1"
            />
          </label>
          <Button type="submit" disabled={loading()}>
            {loading() ? "Connexion..." : "Login"}
          </Button>
        </form>
      )}
    </div>
  );
}