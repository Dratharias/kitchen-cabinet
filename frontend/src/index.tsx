import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { AuthProvider } from "@/stores/authStore";
import { FormCacheProvider } from "@/stores/formCacheStore";
import "../index.css";

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error(
    "Root element not found. Did you forget to add it to your index.html? Or maybe the id attribute got misspelled?"
  );
}

// Désactive React.StrictMode en développement pour éviter les contextes WebGL perdus
const isProd = import.meta.env.MODE === "production";

const Root = (
  <AuthProvider>
    <FormCacheProvider>
      <App />
    </FormCacheProvider>
  </AuthProvider>
);

ReactDOM.createRoot(rootElement).render(
  isProd ? <React.StrictMode>{Root}</React.StrictMode> : Root
);
