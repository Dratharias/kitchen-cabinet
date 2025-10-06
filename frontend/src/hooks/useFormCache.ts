import { useState, useEffect, useRef } from "react";

export type Option = { value: string; label: string };

type Entry = {
  loaded: boolean;
  get: () => Option[];
  set: React.Dispatch<React.SetStateAction<Option[]>>;
};

const REGISTRY = new Map<string, Entry>();

export function useFormCache(type: string, fetcher?: () => Promise<Option[]>) {
  const entryRef = useRef<Entry | null>(null);

  if (!REGISTRY.has(type)) {
    const [items, setItems] = (() => {
      const [value, setter] = useState<Option[]>([]);
      return [() => value, setter];
    })();
    REGISTRY.set(type, { loaded: false, get: items, set: setItems });
  }

  entryRef.current = REGISTRY.get(type)!;

  const ensureLoaded = async () => {
    const entry = entryRef.current!;
    if (!entry.loaded && fetcher) {
      const data = await fetcher().catch(() => []);
      entry.set(data || []);
      entry.loaded = true;
    }
  };

  const prime = (opts?: Option[]) => {
    const entry = entryRef.current!;
    if (opts && opts.length) {
      const merged = dedupe([...opts, ...entry.get()]);
      entry.set(merged);
    }
  };

  const [options, setOptions] = useState<Option[]>(entryRef.current!.get());

  // synchronise avec les changements du cache global
  useEffect(() => {
    setOptions(entryRef.current!.get());
  }, [entryRef.current]);

  return {
    options,
    ensureLoaded,
    prime,
  };
}

export function dedupe(arr: Option[]): Option[] {
  const seen = new Set<string>();
  const out: Option[] = [];
  for (const o of arr) {
    if (!seen.has(o.value)) {
      seen.add(o.value);
      out.push(o);
    }
  }
  return out;
}
