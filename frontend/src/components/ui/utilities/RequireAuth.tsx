import { JSX, Show, createResource } from "solid-js";
import { useNavigate } from "@solidjs/router";
import { Button } from "../atoms/Button";
import { Span } from "../atoms/Span";
import { isAuthenticated } from "@/stores/authStore";

type RequireAuthProps = {
  fallback?: JSX.Element;
  children: JSX.Element;
};

type Blague = {
  blague: string;
  reponse: string;
};

async function fetchBlague(mode: string = "global"): Promise<Blague> {
  const res = await fetch(`https://blague-api.vercel.app/api?mode=${mode}`);
  if (!res.ok) throw new Error("Erreur API Blagues");
  return res.json();
}

export const RequireAuth = (props: RequireAuthProps) => {
  const navigate = useNavigate();
  const [blague] = createResource<Blague>(() => fetchBlague("dev"));

  return (
    <Show
      when={isAuthenticated()}
      fallback={
        props.fallback ?? (
          <div class="text-center p-4">
            <Show
              when={blague()}
              fallback={<Span>Chargement de la blague...</Span>}
            >
              {(data) => (
                <>
                  <Span>{data().blague}</Span>
                  <br />
                  <Span class="font-bold">{data().reponse}</Span>
                </>
              )}
            </Show>
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
