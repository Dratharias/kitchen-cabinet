import { createEffect, ParentProps } from "solid-js";
import { toast, Toaster } from "solid-toast";
import { useNavigate } from "@solidjs/router";
import { setIsAuthenticated } from "./authStore";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

// -----------------------------------
// Auth functions
// -----------------------------------

export async function authenticate(username: string, password: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    if (!res.ok) {
      const err = await res.json();
      toast.error(err.error || "Identifiants incorrects");
      return false;
    }

    const data = await res.json();
    localStorage.setItem("MEALTICKET_JWT", data.token);
    localStorage.setItem("MEALTICKET_USER_ROLE", data.role);
    toast.success("Authentification réussie !");
    setIsAuthenticated(true);
    return true;
  } catch (e) {
    console.error(e);
    toast.error("Erreur réseau");
    return false;
  }
}

export function useLogout() {
  const navigate = useNavigate();
  return () => {
    setIsAuthenticated(false);
    toast.success("Déconnexion réussie !");
    navigate("/login", { replace: true });
  };
}

// -----------------------------------
// Toast Provider component
// -----------------------------------
export function ToastProvider(props: ParentProps) {
  // Optionally: initialize some auth / state on mount
  createEffect(() => {
    // For example, could refresh auth from storage here
  });

  return (
    <>
      {props.children}
      <Toaster position="top-center" />
    </>
  );
}
