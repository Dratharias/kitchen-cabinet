import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, User as UserIcon } from "lucide-react";
import { DotGrid } from "@/components/ui/DotGrid";
import { useAuthStore } from "@/stores/authStore";
import { useAuth } from "@/hooks/useAuth";

export function LoginPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { isAuthenticated } = useAuthStore();
  const { login, logout } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const success = await login(username, password);
    setLoading(false);
    if (success) {
      navigate("/recettes");
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/recettes");
  };

  return (
    <div className="flex min-h-screen flex-col w-full relative items-center justify-center p-8">
      <div className="absolute inset-0 w-full h-full z-0 pointer-events-none bg-[#1F1F1F]">
        <DotGrid
          dotSize={10}
          gap={15}
          baseColor="#292929"
          activeColor="#5B4853"
          proximity={120}
          shockRadius={250}
          shockStrength={5}
          resistance={750}
          returnDuration={1.5}
        />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {isAuthenticated ? (
          <div className="bg-[#1F1F1F] border border-neutral-700 rounded-lg p-8 shadow-lg">
            <h2 className="text-2xl font-bold text-gray-200 mb-6 text-center">
              Connecté
            </h2>
            <p className="text-gray-400 text-center mb-8">
              Vous êtes déjà authentifié
            </p>
            <div className="space-y-3">
              <button
                onClick={() => navigate("/content")}
                className="w-full h-12 bg-amber-600 hover:bg-amber-700 text-white rounded-md font-medium transition-colors hover:cursor-pointer"
              >
                Retour au contenu
              </button>
              <button
                onClick={handleLogout}
                className="w-full h-12 bg-[#292929] hover:bg-[#333333] text-gray-200 rounded-md font-medium transition-colors border border-neutral-700 hover:cursor-pointer"
              >
                Se déconnecter
              </button>
            </div>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="bg-[#1F1F1F] border border-neutral-700 rounded-lg p-8 shadow-lg"
          >
            <h2 className="text-2xl font-bold text-gray-200 mb-8 text-center">
              Connexion
            </h2>

            <div className="space-y-5">
              <div>
                <label
                  htmlFor="username"
                  className="block text-sm font-medium text-gray-300 mb-2"
                >
                  Nom d'utilisateur
                </label>
                <div className="relative">
                  <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Entrez votre nom d'utilisateur"
                    required
                    className="w-full h-12 pl-12 pr-4 rounded-md bg-[#292929] border border-gray-600 text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-300 mb-2"
                >
                  Mot de passe
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Entrez votre mot de passe"
                    required
                    className="w-full h-12 pl-12 pr-4 rounded-md bg-[#292929] border border-gray-600 text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-12 bg-amber-600 hover:bg-amber-700 disabled:bg-amber-800 disabled:cursor-not-allowed text-white rounded-md font-medium transition-colors mt-6 hover:cursor-pointer"
              >
                {loading ? "Connexion..." : "Se connecter"}
              </button>

              <button
                type="button"
                onClick={() => navigate("/recettes")}
                className="w-full h-12 bg-[#292929] hover:bg-[#333333] text-gray-200 rounded-md font-medium transition-colors border border-neutral-700 hover:cursor-pointer"
              >
                Retour
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}