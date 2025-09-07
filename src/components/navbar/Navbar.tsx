import NavIcons from "./NavIcons";
import { useNavState } from "./NavContext";

const Navbar = () => {
  const { isActive, activate, searchOpen, toggleSearch } = useNavState();

  return (
    <nav class="w-full bg-fresh-50 dark:bg-forest-400">
      <div class="max-w-7xl mx-auto p-2 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-16 space-x-2 text-center">
          <NavIcons.LibraryButton
            active={isActive("library")}
            onClick={() => activate("library")}
          />
          <NavIcons.SearchButton
            open={searchOpen()}
            onClick={toggleSearch}
          />
          <NavIcons.FeedButton
            active={isActive("feed")}
            onClick={() => activate("feed")}
          />
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
