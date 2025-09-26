import { createSignal, onCleanup } from "solid-js";
import { SearchSelect } from "./SearchSelect";

type PublicationSearchSelectProps = {
  value?: string;
  placeholder?: string;
  onSelect: (publicationId: string) => void;
  fetcher: () => Promise<{ value: string; label: string }[]>;
  disabled?: boolean;
};

export function PublicationSearchSelect(props: PublicationSearchSelectProps) {
  const [options, setOptions] = createSignal<
    { value: string; label: string }[]
  >([]);
  const [loaded, setLoaded] = createSignal(false);

  onCleanup(() => {
    setOptions([]);
    setLoaded(false);
  });

  const ensureFetched = async () => {
    if (!loaded()) {
      const pubs = await props.fetcher();
      setOptions(pubs);
      setLoaded(true);
    }
  };

  return (
    <div class="flex w-full px-4">
      <div class="space-y-2 w-full" onClick={ensureFetched}>
        <SearchSelect
          value={props.value}
          options={options()}
          placeholder={props.placeholder || "Rechercher une publication..."}
          onSelect={props.onSelect}
          allowCreate={false}
          allowFreeInput={false}
          disabled={props.disabled}
        />
      </div>
    </div>
  );
}
