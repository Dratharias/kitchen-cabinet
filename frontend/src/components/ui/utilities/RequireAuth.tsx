import { ReactNode, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../atoms/Button";
import { Span } from "../atoms/Span";
import { useAuthStore } from "@/stores/authStore";
import { AuthService } from "@/services/auth";

interface RequireAuthProps {
  fallback?: ReactNode;
  children: ReactNode;
}

export function RequireAuth({ fallback, children }: RequireAuthProps) {
  const navigate = useNavigate();
  const { isAuthenticated, refreshAuthState } = useAuthStore();

  useEffect(() => {
    refreshAuthState();
  }, [refreshAuthState]);

  useEffect(() => {
    if (!AuthService.isTokenValid()) {
      refreshAuthState();
      navigate("/login", { replace: true });
    }
  }, [isAuthenticated, navigate, refreshAuthState]);

  if (!isAuthenticated) {
    return (
      <>
        {fallback ?? (
          <div className="text-center p-4">
            <Span>Session expirée ou utilisateur non connecté</Span>
            <Button className="mt-8 mx-auto" onClick={() => navigate("/login")}>
              Se connecter
            </Button>
          </div>
        )}
      </>
    );
  }

  return <>{children}</>;
}
