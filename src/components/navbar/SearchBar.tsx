import { JSX, Show, createMemo } from "solid-js";
import { useNavState } from "./NavContext";
import Input from "../ui/Input";

const SearchBar = (): JSX.Element => {
  const { searchOpen, activeItem } = useNavState();

  const placeholder = createMemo(() =>
    activeItem() === "feed"
      ? "Rechercher parmi les recettes et articles..."
      : "Rechercher parmi les livres et critiques..."
  );

  return (
    <Show when={searchOpen()}>
      <div class="w-full max-w-4xl mx-auto px-1 sm:px-2 mb-2 sm:mt-2">
        <div
          class={`
            rounded-xl shadow-sm p-1 flex items-center
            bg-fresh-50 hover:bg-fresh-100
            dark:bg-forest-400 dark:hover:bg-forest-300
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
