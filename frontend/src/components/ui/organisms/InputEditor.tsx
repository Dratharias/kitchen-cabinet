import Input from "../atoms/Input";

type InputEditorProps<T> = {
  draft: T;
  setDraft: (updater: () => T) => void;
  save: () => void;
};

const InputEditor = <T extends unknown>({ draft, setDraft, save }: InputEditorProps<T>) => {
  return (
    <Input
      value={String(draft ?? "")}
      onInput={(e) => setDraft(() => e.currentTarget.value as unknown as T)}
      onBlur={save}
      autofocus
    />
  );
};

export default InputEditor;
