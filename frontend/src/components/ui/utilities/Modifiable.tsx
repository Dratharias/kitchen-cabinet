import { useState } from "react";
import InputEditor from "../organisms/InputEditor";
import DraftListEditor from "../organisms/DraftListEditor";
import StarsEditor from "../organisms/StarsEditor";
import { usePost } from "@/hooks/usePost";

interface ModifiableProps<T> {
  name: string;
  value: T;
  component: React.ComponentType<{ value: T }>;
  updatePath: string; // API endpoint
}

export function Modifiable<T extends string | number | string[] | number[]>({
  name,
  value,
  component: Component,
  updatePath,
}: ModifiableProps<T>) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<T>(value);
  const { request } = usePost();

  const save = async () => {
    try {
      await request(updatePath, "PATCH", { [name]: draft });
      setEditing(false);
    } catch (err) {
      console.error("Save failed:", err);
    }
  };

  const renderEditor = () => {
    switch (name) {
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
    <div onDoubleClick={() => setEditing(true)} className="w-full">
      {editing ? renderEditor() : <Component value={value} />}
    </div>
  );
}
