import { JSX, Show, onMount, createEffect } from "solid-js";
import { useNavigate } from "@solidjs/router";
import { Button } from "../atoms/Button";
import { Span } from "../atoms/Span";
import { isAuthenticated, refreshAuthState } from "@/stores/authStore";
import { AuthService } from "@/services/auth";

type RequireAuthProps = {
  fallback?: JSX.Element;
  children: JSX.Element;
};

export const RequireAuth = (props: RequireAuthProps) => {
  const navigate = useNavigate();

  onMount(() => {
    refreshAuthState();
  });

  // Watch auth state and redirect immediately if invalid
  createEffect(() => {
    if (!AuthService.isTokenValid()) {
      refreshAuthState();
      navigate("/login", { replace: true });
    }
  });

  return (
    <Show
      when={isAuthenticated()}
      fallback={
        props.fallback ?? (
          <div class="text-center p-4">
            <Span>Session expirée ou utilisateur non connecté</Span>
            <Button class="mt-8 mx-auto" onClick={() => navigate("/login")}>
              Se connecter
            </Button>
          </div>
        )
      }
    >
      {props.children}
    </Show>
  );
};
