import NavIcons from "./NavIcons";
import { useNavState } from "./NavContext";

const Navbar = () => {
  const { isActive, activate, searchOpen, toggleSearch } = useNavState();

  const navButtonClasses = "";

  return (
    <nav class="w-full bg-mintsage-50 dark:bg-forest-400 text-forest-700 dark:text-harmony-100">
      <div class="max-w-7xl mx-auto p-2 sm:px-6 lg:px-8">
        <div class="flex items-center justify-evenly h-16 space-x-2 text-center">
          <NavIcons.LibraryButton
            active={isActive("library")}
            onClick={() => activate("library")}
            class="px-3 py-2 rounded-md text-current hover:bg-forest-200 dark:hover:bg-harmony-700 transition-colors duration-200"
          />
          <NavIcons.SearchButton
            open={searchOpen()}
            onClick={toggleSearch}
            class="px-3 py-2 rounded-md text-current hover:bg-forest-200 dark:hover:bg-harmony-700 transition-colors duration-200"
          />
          <NavIcons.FeedButton
            active={isActive("feed")}
            onClick={() => activate("feed")}
            class="px-3 py-2 rounded-md text-current hover:bg-forest-200 dark:hover:bg-harmony-700 transition-colors duration-200"
          />
        </div>
      </div>
    </nav>

  );
};

export default Navbar;
