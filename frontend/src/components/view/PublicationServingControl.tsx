import { Users, Minus, Plus, Clock } from "lucide-react";

interface Props {
  servings: number;
  servingFactor: number;
  onServingChange: (factor: number) => void;
  prepTime?: number;
}

export function PublicationServingControl({
  servings,
  servingFactor,
  onServingChange,
  prepTime,
}: Props) {
  const baseServings = servings || 1;
  const currentServings = Math.round(baseServings * servingFactor);

  const adjustServings = (delta: number) => {
    const newServings = Math.max(1, currentServings + delta);
    onServingChange(newServings / baseServings);
  };

  return (
    <div className="flex items-center justify-between p-2 bg-[#1F1F1F]/0 border-b border-gray-700">
      {!isNaN(prepTime) && (
        <div className="flex items-center gap-2 text-gray-300">
          <Clock className="w-4 h-4 text-amber-400" />
          <span className="text-sm">{prepTime} min</span>
        </div>
      )}

      <div className="flex items-center gap-3">
        <Users className="w-4 h-4 text-amber-400" />
        <button
          onClick={() => adjustServings(-1)}
          type="button"
          className="hover:cursor-pointer w-4 h-4 flex items-center justify-center rounded-full bg-gray-700 hover:bg-gray-600 text-white transition"
          disabled={currentServings <= 1}
        >
          <Minus className="w-2 h-2" />
        </button>
        <span className="text-white font-semibold min-w-[80px] text-center">
          {currentServings} {currentServings > 1 ? "portions" : "portion"}
        </span>
        <button
          onClick={() => adjustServings(1)}
          type="button"
          className="hover:cursor-pointer w-4 h-4 flex items-center justify-center rounded-full bg-gray-700 hover:bg-gray-600 text-white transition"
        >
          <Plus className="w-2 h-2" />
        </button>
      </div>
    </div>
  );
}
