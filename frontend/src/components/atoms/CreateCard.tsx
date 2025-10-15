import React from "react";
import { Plus } from "lucide-react";

interface CreateCardProps {
  onClick: () => void;
}

/**
 * Carte d’ajout de publication affichée uniquement
 * lorsque l’utilisateur est connecté.
 */
export const CreateCard: React.FC<CreateCardProps> = ({ onClick }) => {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center justify-center w-full min-h-full rounded-xl border-2 border-dashed border-amber-500 text-amber-500 bg-[#1F1F1F]/80 hover:text-amber-400 hover:border-amber-400 hover:bg-[#292929] transition-colors duration-200 py-12 hover:cursor-pointer"
    >
      <Plus size={44} className="mb-2" />
      <span className="text-base font-medium">Créer une publication</span>
    </button>
  );
};
