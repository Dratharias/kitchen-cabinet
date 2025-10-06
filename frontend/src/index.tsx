import React from "react";
import ReactDOM from "react-dom/client";
import "./theme/theme.css";
import App from "./App";
import { AuthProvider } from "@/stores/authStore";
import { FormCacheProvider } from "@/stores/formCacheStore";

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error(
    "Root element not found. Did you forget to add it to your index.html? Or maybe the id attribute got misspelled?"
  );
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <AuthProvider>
      <FormCacheProvider>
        <App />
      </FormCacheProvider>
    </AuthProvider>
  </React.StrictMode>
);
