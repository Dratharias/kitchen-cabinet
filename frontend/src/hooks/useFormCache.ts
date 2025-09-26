import { createSignal, Accessor } from "solid-js";

export type Option = { value: string; label: string };

type Entry = {
  loaded: boolean;
  get: Accessor<Option[]>;
  set: (v: Option[]) => void;
};

const REGISTRY = new Map<string, Entry>();

export function useFormCache(type: string, fetcher?: () => Promise<Option[]>) {
  let entry = REGISTRY.get(type);
  if (!entry) {
    const [items, setItems] = createSignal<Option[]>([]);
    entry = { loaded: false, get: items, set: setItems };
    REGISTRY.set(type, entry);
  }

  const ensureLoaded = async () => {
    if (!entry!.loaded && fetcher) {
      const data = await fetcher().catch(() => []);
      entry!.set(data || []);
      entry!.loaded = true;
    }
  };

  const prime = (opts?: Option[]) => {
    if (opts && opts.length) {
      // priorité aux options fournies par l’appelant
      const merged = dedupe([...opts, ...entry!.get()]);
      entry!.set(merged);
    }
  };

  return {
    options: entry.get, // cache courant
    ensureLoaded, // déclenche le fetch si jamais chargé
    prime, // injecte des options locales
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
