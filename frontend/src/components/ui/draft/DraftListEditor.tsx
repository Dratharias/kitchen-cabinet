import { JSX, For } from "solid-js";
import Button from "../html/Button";
import { Span } from "../html/Span";

type DraftListProps<T> = {
  draft: () => T;
  setDraft: (updater: () => T) => void;
  save: () => void;
};

const DraftList = <T extends unknown>(props: DraftListProps<T>) => {
  return (
    <div class="border rounded p-2">
      <For each={(props.draft() as unknown as string[]) ?? []}>
        {(item, i) => (
          <div class="flex justify-between items-center py-1">
            <Span>{item}</Span>
            <Button
              class="text-red-500"
              onClick={() => {
                const arr = [...(props.draft() as unknown as string[])];
                arr.splice(i(), 1);
                props.setDraft(() => arr as unknown as T);
              }}
            >
              🗑
            </Button>
          </div>
        )}
      </For>

      <div class="mt-2 flex gap-2">
        <Button
          class="bg-green-500 text-white"
          onClick={() =>
            props.setDraft(() => [...(props.draft() as unknown as string[]), ""] as unknown as T)
          }
        >
          + Ajouter
        </Button>
        <Button
          class="bg-blue-500 text-white"
          onClick={props.save}
        >
          Sauvegarder
        </Button>
      </div>
    </div>
  );
};

export default DraftList;
