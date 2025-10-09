import { useState, useMemo, useEffect, useCallback } from "react";

export type Option = { value: string; label: string };

interface Params {
  value?: string;
  allowFreeInput?: boolean; // false = mode strict
  allowCreate?: boolean; // false = désactive la création
  onSelect?: (val: string) => void;
  onCreate?: (label: string) => void;
}

export function useSearchSelect(
  options: Option[] | (() => Option[]),
  params?: Params,
) {
  const getOptions = useCallback(
    () => (typeof options === "function" ? options() : options),
    [options],
  );

  const [text, setText] = useState("");
  const [open, setOpen] = useState(false);

  const filtered = useMemo(() => {
    const s = text.toLowerCase().trim();
    if (!s) return getOptions();
    return getOptions().filter((o) => o.label.toLowerCase().includes(s));
  }, [text, getOptions]);

  const selected = useMemo(() => {
    const v = params?.value;
    if (!v) return undefined;
    return (
      getOptions().find((o) => o.value === v) ||
      getOptions().find((o) => o.label === v)
    );
  }, [params?.value, getOptions]);

  const clearIfNoMatch = useCallback(() => {
    if (params?.allowFreeInput === false) {
      const val = text.trim();
      const match = getOptions().find(
        (o) => o.label === val || o.value === val,
      );
      if (!match) {
        setText("");
        params?.onSelect?.("");
      }
    }
  }, [text, getOptions, params]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>, blurInput: () => void) => {
      if (e.key === "Enter") {
        e.preventDefault();
        const val = text.trim();
        const hasExact = getOptions().some(
          (o) => o.label === val || o.value === val,
        );

        // Création si pas de match exact
        if (params?.allowCreate !== false && val && !hasExact) {
          if (params?.onCreate) params.onCreate(val);
          else params?.onSelect?.(val);
          setText("");
          setOpen(false);
          return;
        }

        // Mode strict
        if (params?.allowFreeInput === false) {
          if (hasExact) {
            const exact = getOptions().find(
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
    },
    [text, getOptions, params],
  );

  useEffect(() => {
    const handleDocClick = (e: MouseEvent) => {
      const inside = (e.target as Element).closest("[data-search-select]");
      if (!inside) {
        clearIfNoMatch();
        setOpen(false);
      }
    };

    document.addEventListener("click", handleDocClick);
    return () => document.removeEventListener("click", handleDocClick);
  }, [clearIfNoMatch]);

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
