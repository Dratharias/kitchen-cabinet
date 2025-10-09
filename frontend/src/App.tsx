import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ToastProvider } from "./components/ToastProvider";
import { LoginPage } from "./pages/LoginPage";
import { ContentBrowser } from "./pages/ContentBrowser";
import { PublicationView } from "./pages/PublicationView";
import NotFoundPage from "./pages/NotFoundPage";

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <div className="min-h-screen w-full flex flex-col bg-[#1F1F1F] text-gray-200">
          <Routes>
            {/* Routes fixes et explicites */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/publication/:id" element={<PublicationView />} />
            <Route path="/404" element={<NotFoundPage />} />

            {/* Routes normales */}
            <Route path="/" element={<ContentBrowser />} />
            <Route path="/:category" element={<ContentBrowser />} />

            {/* Fallback global */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </div>
      </ToastProvider>
    </BrowserRouter>
  );
}
