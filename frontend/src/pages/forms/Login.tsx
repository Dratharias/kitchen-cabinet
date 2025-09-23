import { createSignal } from "solid-js";
import { isAuthenticated } from "@/stores/authStore";
import { useAuth } from "@/hooks/useAuth";
import Button from "@/components/ui/atoms/Button";
import Input from "@/components/ui/atoms/Input";

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

  return (
    <div class="flex items-center justify-center min-h-[70vh] w-full text-prim-txt dark:text-prim-txt-d">
      {isAuthenticated() ? (
        <Button class="mx-auto" onClick={logout}>
          Logout
        </Button>
      ) : (
        <form onSubmit={handleSubmit} class="w-full max-w-sm space-y-4">
          <h2 class="text-xl font-bold mb-4">Login</h2>
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
