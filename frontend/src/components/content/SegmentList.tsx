import { For } from "solid-js";
import { Input } from "@/components/ui/atoms/Input";
import { Button } from "@/components/ui/atoms/Button";
import { Span } from "@/components/ui/atoms/Span";
import { PlusIcon, TrashIcon } from "@/components/ui/atoms/Icons";

type Segment = {
  title: string;
  paragraph: string;
  prepTimes: any[];
};

type SegmentListProps = {
  contentIndex: number;
  segments: Segment[];
  setForm: (...args: any[]) => void;
};

const newSegment = (): Segment => ({
  title: "",
  paragraph: "",
  prepTimes: [],
});

export function SegmentList(props: SegmentListProps) {
  const addSegment = () =>
    props.setForm(
      "contents",
      props.contentIndex,
      "segments",
      (segments: Segment[]) => [...segments, newSegment()],
    );

  const removeSegment = (i: number) =>
    props.setForm(
      "contents",
      props.contentIndex,
      "segments",
      (segments: Segment[]) => segments.filter((_, idx) => idx !== i),
    );

  return (
    <div class="mb-8 rounded-xl p-4 pb-8 ring-1 ring-prim-txt/40 dark:ring-prim-txt-d/40">
      <div class="flex justify-between items-center mb-2">
        <Span class="text-lg font-semibold">Instructions</Span>
      </div>

      <For each={props.segments}>
        {(s, i) => (
          <div class="border-b border-dashed p-4 mb-4">
            <div class="flex justify-center items-center mb-3">
              <Span class="text-center mx-auto text-xl w-full ml-8">
                Étape {i() + 1}
              </Span>
              <Button
                class="relative !p-0"
                type="button"
                variant="secondary"
                icon={<TrashIcon />}
                onClick={() => removeSegment(i())}
              />
            </div>
            <Input
              placeholder="Titre de l'étape"
              value={s.title}
              onInput={(e) =>
                props.setForm(
                  "contents",
                  props.contentIndex,
                  "segments",
                  i(),
                  "title",
                  e.currentTarget.value,
                )
              }
            />
            <textarea
              class="w-full px-3 py-2 border rounded-md mt-2 text-sm mb-4"
              rows={3}
              placeholder="Description de l'étape"
              value={s.paragraph}
              onInput={(e) =>
                props.setForm(
                  "contents",
                  props.contentIndex,
                  "segments",
                  i(),
                  "paragraph",
                  e.currentTarget.value,
                )
              }
            />
          </div>
        )}
      </For>

      {props.segments.length === 0 ? (
        <Button
          class="mx-auto mt-2"
          icon={<PlusIcon class="w-4 h-4" />}
          variant="primary"
          onClick={addSegment}
        >
          Ajouter une étape
        </Button>
      ) : (
        <Button
          class="mx-auto mt-2"
          icon={<PlusIcon class="w-4 h-4" />}
          variant="terniary"
          onClick={addSegment}
        />
      )}
    </div>
  );
}
