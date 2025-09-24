import { For } from "solid-js";
import { Input } from "@/components/ui/atoms/Input";
import { Button } from "@/components/ui/atoms/Button";

export function SegmentList({ contentIndex, segments, setForm }) {
  const addSegment = () =>
    setForm("contents", contentIndex, "segments", [...segments, { title: "", paragraph: "", prepTimes: [] }]);

  const removeSegment = (i: number) =>
    setForm("contents", contentIndex, "segments", segments.filter((_: any, idx: number) => idx !== i));

  return (
    <div class="mb-4">
      <div class="flex justify-between items-center mb-2">
        <h5 class="font-medium">Instructions</h5>
        <Button type="button" onClick={addSegment}>+ Ajouter une étape</Button>
      </div>

      <For each={segments}>
        {(s: any, i) => (
          <div class="border border-gray-100 rounded p-3 mb-2">
            <div class="flex justify-between items-center mb-2">
              <span class="text-sm font-medium">Étape {i() + 1}</span>
              <Button type="button" onClick={() => removeSegment(i())}>Supprimer</Button>
            </div>
            <Input
              placeholder="Titre de l'étape"
              value={s.title}
              onInput={(e) => setForm("contents", contentIndex, "segments", i(), "title", e.currentTarget.value)}
            />
            <textarea
              class="w-full px-3 py-2 border border-gray-300 rounded-md mt-2"
              rows="3"
              placeholder="Description de l'étape"
              value={s.paragraph}
              onInput={(e) => setForm("contents", contentIndex, "segments", i(), "paragraph", e.currentTarget.value)}
            />
          </div>
        )}
      </For>
    </div>
  );
}
