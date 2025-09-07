import { createSignal } from "solid-js";
import { authenticate } from "../../services/ToastProvider";
import { setIsAuthenticated } from "../../services/authStore";

export default function LoginForm() {
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
    <div class="flex items-center justify-center min-h-screen bg-gray-100">
      <form 
        class="bg-white p-6 rounded-lg shadow-md w-80" 
        onSubmit={handleSubmit}
      >
        <h2 class="text-2xl font-semibold mb-4 text-center">Login</h2>
        
        <label class="block mb-2 text-sm font-medium text-gray-700">
          Username
          <input
            type="text"
            value={username()}
            onInput={(e) => setUsername(e.currentTarget.value)}
            class="mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </label>

        <label class="block mb-4 text-sm font-medium text-gray-700">
          Password
          <input
            type="password"
            value={password()}
            onInput={(e) => setPassword(e.currentTarget.value)}
            class="mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </label>

        <button
          type="submit"
          class="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
          disabled={loading()}
        >
          {loading() ? "Connexion..." : "Login"}
        </button>
      </form>
    </div>
  );
}
