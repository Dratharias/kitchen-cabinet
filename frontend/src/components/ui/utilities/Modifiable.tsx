import { Component, Show, createSignal } from "solid-js";
import InputEditor from "../organisms/InputEditor";
import DraftListEditor from "../organisms/DraftListEditor";
import StarsEditor from "../organisms/StarsEditor";
import { usePost } from "@/hooks/usePost";

interface ModifiableProps<T> {
  name: string;
  value: T;
  component: Component<{ value: T }>;
  updatePath: string; // API endpoint
}

export function Modifiable<T extends string | number | string[] | number[]>(props: ModifiableProps<T>) {
  const [editing, setEditing] = createSignal(false);
  const [draft, setDraft] = createSignal<T>(props.value);
  const { request } = usePost();

  const save = async () => {
    try {
      await request(props.updatePath, "PATCH", { [props.name]: draft() });
      setEditing(false);
    } catch (err) {
      console.error("Save failed:", err);
    }
  };

  const renderEditor = () => {
    switch (props.name) {
      case "title":
      case "description":
        return <InputEditor draft={draft} setDraft={setDraft} save={save} />;
      case "list":
        return <DraftListEditor draft={draft} setDraft={setDraft} save={save} />;
      case "stars":
        return <StarsEditor draft={draft} setDraft={setDraft} />;
      default:
        return <InputEditor draft={draft} setDraft={setDraft} save={save} />;
    }
  };

  return (
    <div ondblclick={() => setEditing(true)} class="w-full">
      <Show when={editing()} fallback={<props.component value={props.value} />}>
        {renderEditor()}
      </Show>
    </div>
  );
}