import { Router, Route } from "@solidjs/router";
import { Layout } from "./views/layout/Layout";
import { ToastProvider } from "./components/ToastProvider";
import { LoginForm } from "./pages/forms/Login";
import { ContentBrowser } from "./pages/ContentBrowser";

function App() {
  return (
    <Router>
      <ToastProvider>
        {/* Home - Default to foods */}
        <Route
          path="/"
          component={() => (
            <Layout>
              <ContentBrowser feeds />
            </Layout>
          )}
        />

        {/* Content Browser */}
        <Route
          path="/reviews"
          component={() => (
            <Layout>
              <ContentBrowser reviews />
            </Layout>
          )}
        />
        <Route
          path="/feeds"
          component={() => (
            <Layout>
              <ContentBrowser feeds />
            </Layout>
          )}
        />

        {/* Authentication */}
        <Route
          path="/login"
          component={() => (
            <Layout>
              <LoginForm />
            </Layout>
          )}
        />
      </ToastProvider>
    </Router>
  );
}

export default App;
