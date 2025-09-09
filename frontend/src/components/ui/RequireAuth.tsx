import { JSX, Show } from "solid-js";
import { isAuthenticated } from "../../services/authStore";
import { useNavigate } from "@solidjs/router";

type RequireAuthProps = {
  fallback?: JSX.Element;
  children: JSX.Element;
};

const RequireAuth = (props: RequireAuthProps) => {
  const navigate = useNavigate();

  return (
    <Show
      when={isAuthenticated()}
      fallback={
        props.fallback ?? (
          <div class="text-center p-4">
            <p class="text-sm text-gray-600 dark:text-gray-300">
              Vous devez être connecté.
            </p>
            <button
              class="mt-2 text-fresh-400 dark:text-forest-300 underline"
              onClick={() => navigate("/login")}
            >
              Se connecter
            </button>
          </div>
        )
      }
    >
      {props.children}
    </Show>
  );
};

export default RequireAuth;
