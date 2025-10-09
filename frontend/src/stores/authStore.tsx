import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { AuthService } from "@/services/auth";

interface User {
  username: string;
  role: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  currentUser: User | null;
  refreshAuthState: () => void;
  setAuth: (auth: boolean, user?: User | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(
    AuthService.isTokenValid(),
  );
  const [currentUser, setCurrentUser] = useState<User | null>(
    AuthService.getUser(),
  );

  const refreshAuthState = () => {
    const valid = AuthService.isTokenValid();
    setIsAuthenticated(valid);
    setCurrentUser(valid ? AuthService.getUser() : null);
  };

  const setAuth = (auth: boolean, user?: User | null) => {
    setIsAuthenticated(auth);
    setCurrentUser(user ?? null);
  };

  useEffect(() => {
    const valid = AuthService.isTokenValid();
    if (!valid && isAuthenticated) {
      localStorage.removeItem("auth_token");
      localStorage.removeItem("auth_user");
      setIsAuthenticated(false);
      setCurrentUser(null);
    }
  }, [isAuthenticated]);

  return (
    <AuthContext.Provider
      value={{ isAuthenticated, currentUser, refreshAuthState, setAuth }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthStore() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuthStore must be used within AuthProvider");
  return ctx;
}
