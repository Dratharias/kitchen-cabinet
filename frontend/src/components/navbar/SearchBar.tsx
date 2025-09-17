import { JSX, Show, createMemo } from "solid-js";
import { useNavState } from "./NavContext";
import Input from "../ui/atoms/Input";

const SearchBar = (): JSX.Element => {
  const { searchOpen, activeItem } = useNavState();

  const placeholder = createMemo(() =>
    activeItem() === "feed"
      ? "Rechercher parmi les recettes et articles..."
      : "Rechercher parmi les livres et critiques..."
  );

  return (
    <Show when={searchOpen()}>
      <div class="w-full max-w-4xl mx-auto px-1 sm:px-2 mb-2 sm:mt-2 !opacity-100">
        <div
          class={`
            rounded-xl shadow-sm p-1 flex items-center
            bg-mintsage-50 hover:bg-forest-200
            dark:bg-forest-400 dark:hover:bg-harmony-700
          `}
        >
          <Input
            type="text"
            placeholder={placeholder()}
            autofocus
          />
        </div>
      </div>
    </Show>
  );
};

export default SearchBar;
