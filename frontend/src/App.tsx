import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "./views/layout/Layout";
import { ToastProvider } from "./components/ToastProvider";
import { LoginForm } from "./pages/forms/Login";
import { ContentBrowser } from "./pages/ContentBrowser";
import { PublicationPage } from "./pages/forms/Publication";

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <Layout>
          <Routes>
            {/* Home - Default to feeds */}
            <Route path="/" element={<ContentBrowser feeds />} />

            {/* Content Browser */}
            <Route path="/reviews" element={<ContentBrowser reviews />} />
            <Route path="/feeds" element={<ContentBrowser feeds />} />

            {/* Authentication */}
            <Route path="/login" element={<LoginForm />} />

            {/* Publications */}
            <Route path="/create" element={<PublicationPage />} />
            <Route path="/:id/edit" element={<PublicationPage />} />
          </Routes>
        </Layout>
      </ToastProvider>
    </BrowserRouter>
  );
}
