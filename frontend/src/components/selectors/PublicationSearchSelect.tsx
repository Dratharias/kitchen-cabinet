import { JSX, onMount } from "solid-js";
import { SearchSelect } from "./SearchSelect";
import { useFormCache } from "@/hooks/useFormCache";

type PublicationSearchSelectProps = {
  value?: string;
  placeholder?: string;
  onSelect: (publicationId: string) => void;
  fetcher: () => Promise<{ value: string; label: string }[]>;
  disabled?: boolean;
};

export function PublicationSearchSelect(
  props: PublicationSearchSelectProps,
): JSX.Element {
  const { options, ensureLoaded } = useFormCache("Publication", props.fetcher);

  // Charger une fois au montage
  onMount(ensureLoaded);

  return (
    <div class="flex w-full px-4">
      <div class="space-y-2 w-full">
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
