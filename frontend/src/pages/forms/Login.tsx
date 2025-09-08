import { createSignal } from "solid-js";
import { authenticate } from "../../services/ToastProvider";
import { setIsAuthenticated } from "../../services/authStore";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";

export function LoginForm() {
  const [username, setUsername] = createSignal("");
  const [password, setPassword] = createSignal("");
  const [loading, setLoading] = createSignal(false);

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    setLoading(true);
    if (await authenticate(username(), password())) {
        setIsAuthenticated(true);
    }
    setLoading(false);
  };

  return (
    <div class="flex items-center justify-center min-h-[70vh] w-full">
      <form onSubmit={handleSubmit} class="w-full max-w-sm">
        <h2 class="text-2xl font-semibold mb-4 text-center">Login</h2>
        
        <label class="block mb-2 text-sm font-medium">
          Username
          <Input
            type="text"
            value={username()}
            onInput={(e) => setUsername(e.currentTarget.value)}
            required
            class="mt-1"
          />
        </label>

        <label class="block mb-4 text-sm font-medium">
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
    </div>
  );
}
