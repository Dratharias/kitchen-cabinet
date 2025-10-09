import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function PublicationHeader({ title }: { title: string }) {
  const navigate = useNavigate();
  return (
    <div className="block md:flex items-center justify-center md:justify-between mb-6">
      <button
        onClick={() => navigate(-1)}
        className="flex mb-2 md:mb-0 items-center gap-2 text-gray-400 hover:text-white transition hover:cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        Retour
      </button>
      <h1 className="text-3xl font-bold text-white">{title}</h1>
    </div>
  );
}
