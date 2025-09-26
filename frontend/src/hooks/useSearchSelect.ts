import { createSignal, createMemo, onCleanup } from "solid-js";

type Option = { value: string; label: string };

export function useSearchSelect(
  options: () => Option[],
  params?: {
    value?: string;
    allowFreeInput?: boolean; // false = mode strict
    allowCreate?: boolean; // false = désactive la création
    onSelect?: (val: string) => void;
    onCreate?: (label: string) => void;
  },
) {
  const [text, setText] = createSignal("");
  const [open, setOpen] = createSignal(false);

  const filtered = createMemo(() => {
    const s = text().toLowerCase().trim();
    if (!s) return options();
    return options().filter((o) => o.label.toLowerCase().includes(s));
  });

  // 🔑 Corrigé : on accepte value ou label
  const selected = createMemo(() => {
    const v = params?.value;
    if (!v) return undefined;
    return (
      options().find((o) => o.value === v) ||
      options().find((o) => o.label === v)
    );
  });

  const clearIfNoMatch = () => {
    if (params?.allowFreeInput === false) {
      const val = text().trim();
      const match = options().find((o) => o.label === val || o.value === val);
      if (!match) {
        setText("");
        params?.onSelect?.("");
      }
    }
  };

  const handleKeyDown = (e: KeyboardEvent, blurInput: () => void) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const val = text().trim();
      const hasExact = options().some(
        (o) => o.label === val || o.value === val,
      );

      // Création si pas de match exact
      if (params?.allowCreate !== false && val && !hasExact) {
        if (params?.onCreate) params.onCreate(val);
        else params?.onSelect?.(val);
        setText("");
        setOpen(false);
        return; // pas de blur pour laisser le parent afficher le champ
      }

      // Mode strict : match exact ou clear
      if (params?.allowFreeInput === false) {
        if (hasExact) {
          const exact = options().find(
            (o) => o.label === val || o.value === val,
          )!;
          params?.onSelect?.(exact.value);
          setText("");
        } else {
          setText("");
          params?.onSelect?.("");
        }
        setOpen(false);
        blurInput();
        return;
      }

      // Mode libre
      setOpen(false);
      blurInput();
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  const handleDocClick = (e: Event) => {
    const inside = (e.target as Element).closest("[data-search-select]");
    if (!inside) {
      clearIfNoMatch();
      setOpen(false);
    }
  };
  document.addEventListener("click", handleDocClick);
  onCleanup(() => document.removeEventListener("click", handleDocClick));

  return {
    text,
    setText,
    open,
    setOpen,
    filtered,
    selected,
    clearIfNoMatch,
    handleKeyDown,
  };
}
