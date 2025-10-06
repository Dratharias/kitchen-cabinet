import { JSX, useMemo } from "react";
import { useNavState } from "./NavContext";
import { Input } from "../ui/atoms/Input";

const SearchBar = (): JSX.Element | null => {
  const { searchOpen, activeItem } = useNavState();

  const placeholder = useMemo(
    () =>
      activeItem === "feed"
        ? "Rechercher parmi les recettes et articles..."
        : "Rechercher parmi les livres et critiques...",
    [activeItem]
  );

  if (!searchOpen) return null;

  return (
    <div className="w-full max-w-4xl mx-auto px-1 sm:px-2 mb-2 sm:mt-2 opacity-100">
      <div
        className={`
          rounded-xl shadow-sm p-1 flex items-center
          bg-mintsage-50 hover:bg-forest-200
          dark:bg-forest-400 dark:hover:bg-harmony-700
        `}
      >
        <Input type="text" placeholder={placeholder} autoFocus />
      </div>
    </div>
  );
};

export default SearchBar;
