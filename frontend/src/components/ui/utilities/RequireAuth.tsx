import { JSX, Show } from "solid-js";
import { isAuthenticated } from "../../../services/authStore";
import { useNavigate } from "@solidjs/router";
import { colorTheme, surfaceTheme } from "../../../theme/colors";

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
          <div class={`text-center p-4 ${surfaceTheme.Card}`}>
            <p class={`${surfaceTheme.CardSubtitle}`}>
              Vous devez être connecté.
            </p>
            <button
              class={`${colorTheme.Button} mt-2 underline`}
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
