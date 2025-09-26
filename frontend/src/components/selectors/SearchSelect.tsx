import { Show, For } from "solid-js";
import { Span } from "@/components/ui/atoms/Span";
import { Button } from "../ui/atoms/Button";
import { Input } from "../ui/atoms/Input";
import { SelectedItem } from "./SelectedItem";
import { useSearchSelect } from "@/hooks/useSearchSelect";

type Option = { value: string; label: string };

type SearchSelectProps = {
  value?: string;
  options: { value: string; label: string }[];
  placeholder?: string;
  onSelect: (val: string) => void;
  onCreate?: (label: string) => void;
  disabled?: boolean;
  allowCreate?: boolean;
  allowFreeInput?: boolean;
  displayLabel?: string;
};

export function SearchSelect(props: SearchSelectProps) {
  const { text, setText, open, setOpen, filtered, selected, handleKeyDown } =
    useSearchSelect(() => props.options, {
      value: props.value,
      allowFreeInput: props.allowFreeInput,
      allowCreate: props.allowCreate,
      onSelect: props.onSelect,
      onCreate: props.onCreate,
    });

  const handleSelect = (o: Option) => {
    props.onSelect(o.value);
    setText("");
    setOpen(false);
  };

  return (
    <div data-search-select class="relative w-full">
      {/* Chip/tag si sélection */}
      <Show
        when={Boolean(props.value)}
        fallback={
          <Input
            type="text"
            class="px-3 py-2"
            placeholder={props.placeholder}
            value={text()}
            onClick={() => setOpen(true)}
            onInput={(e) => {
              setText((e.target as HTMLInputElement).value);
              setOpen(true);
            }}
            onKeyDown={(e) =>
              handleKeyDown(e, () =>
                (e.currentTarget as HTMLInputElement).blur(),
              )
            }
            disabled={props.disabled}
          />
        }
      >
        <SelectedItem
          label={
            props.displayLabel ??
            selected()?.label ??
            (typeof props.value === "string" ? props.value : "")
          }
          onRemove={() => props.onSelect("")}
        />
      </Show>

      {/* Dropdown visible uniquement si résultats OU création possible */}
      <Show
        when={
          open() &&
          !selected() &&
          (filtered().length > 0 ||
            (props.allowCreate !== false && text().trim()))
        }
      >
        <div class="absolute top-full left-0 z-50 mt-1 w-full min-w-[150%] -ml-[25%] shadow-lg max-h-60 overflow-y-auto">
          <For each={filtered()}>
            {(o) => (
              <Button
                variant="primary"
                class="w-full text-left px-3 py-2 hover:bg-gray-100"
                onClick={() => handleSelect(o)}
              >
                <Span>{o.label}</Span>
              </Button>
            )}
          </For>

          {/* Bouton création si aucune correspondance */}
          <Show
            when={
              props.allowCreate !== false &&
              filtered().length === 0 &&
              text().trim()
            }
          >
            <Button
              variant="primary"
              class="w-full text-left px-3 py-2 hover:bg-gray-100 border-none ring-1 rounded-none"
              onClick={() => {
                const newLabel = text().trim();
                if (props.onCreate) props.onCreate(newLabel);
                else props.onSelect(newLabel);
                setText("");
                setOpen(false); // même logique que Enter
              }}
            >
              <Span>Créer « {text().trim()} »</Span>
            </Button>
          </Show>
        </div>
      </Show>
    </div>
  );
}
