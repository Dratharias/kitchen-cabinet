import { API_BASE } from "@/config/api";
import { useState, useEffect } from "react";

export function SubRecipeView({ subRecipeId }: { subRecipeId: string }) {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function load() {
      if (loading || data) return;
      setLoading(true);
      const token = localStorage.getItem("auth_token");
      const res = await fetch(`${API_BASE}/api/publications/${subRecipeId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setData(await res.json());
      setLoading(false);
    }
    load();
  }, [subRecipeId]);

  if (loading)
    return <div className="pl-8 text-gray-500 text-sm">Chargement…</div>;
  if (!data) return null;

  const blocks = data.contents?.filter((c: any) => c.is_ingredient) || [];

  return (
    <div className="pl-8 mt-2 border-l border-gray-700">
      <h4 className="text-sm font-semibold text-amber-400 mb-1">
        {data.title}
      </h4>
      <ul className="text-gray-300 text-sm space-y-1">
        {blocks.flatMap((b: any) =>
          (b.content_ingredients || []).map((i: any) => (
            <li key={i.ingredient_id}>
              {i.product?.name}{" "}
              {i.ingredient_units?.[0]?.unit?.name
                ? "(" + i.ingredient_units[0].unit.name + ")"
                : ""}
              {i.quantity ? " - " + i.quantity : ""}
            </li>
          )),
        )}
      </ul>
    </div>
  );
}
