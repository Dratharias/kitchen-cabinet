import Stars from "../utilities/Stars";

type StarsEditorProps<T> = {
  draft: T;
  setDraft: (updater: () => T) => void;
};

const StarsEditor = <T extends unknown>({ draft, setDraft }: StarsEditorProps<T>) => {
  return (
    <Stars
      score={(draft as unknown as number) ?? 0}
      onChange={(v: number) => setDraft(() => v as T)}
      readonly={false}
    />
  );
};

export default StarsEditor;
