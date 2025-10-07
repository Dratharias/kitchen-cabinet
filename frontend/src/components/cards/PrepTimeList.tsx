"use client";

import { Clock } from "lucide-react";

interface PrepTime {
  prep_time_id: string;
  duration: number;
  style?: {
    category_id: string;
    str_value: string;
  } | null;
}

interface PrepTimeListProps {
  prepTimes: PrepTime[];
}

export function PrepTimeList({ prepTimes }: PrepTimeListProps) {
  if (!prepTimes || prepTimes.length === 0) return null;

  return (
    <div className="mt-3 bg-[#111] border border-neutral-800 rounded-xl p-3">
      <h4 className="text-sm font-semibold text-amber-400 flex items-center gap-2 mb-2">
        <Clock className="w-4 h-4 text-amber-400" />
        Détails du temps de préparation
      </h4>
      <ul className="space-y-1 text-gray-300 text-sm">
        {prepTimes.map((pt) => (
          <li key={pt.prep_time_id} className="flex items-center gap-2">
            <span>{pt.duration} min</span>
            {pt.style?.str_value && (
              <span className="text-gray-500">({pt.style.str_value})</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
