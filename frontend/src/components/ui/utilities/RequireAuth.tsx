import { JSX, Show } from "solid-js";
import { useNavigate } from "@solidjs/router";
import { Button } from "../atoms/Button";
import { Span } from "../atoms/Span";
import { isAuthenticated } from "@/stores/authStore";

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
          <div class={`text-center p-4`}>
            <Span>
              Vous devez être connecté.
            </Span>
            <Button
              class={`mt-2 underline`}
              onClick={() => navigate("/login")}
            >
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

export default RequireAuth;
