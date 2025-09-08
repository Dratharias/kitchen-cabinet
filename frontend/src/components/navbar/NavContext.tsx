import { Accessor, createContext, useContext } from "solid-js";
import { createSignal } from "solid-js";

export type NavItem = "feed" | "library";

type NavState = {
  activeItem: Accessor<NavItem>;
  isActive: (item: NavItem) => boolean;
  activate: (item: NavItem) => void;
  searchOpen: Accessor<boolean>;
  toggleSearch: () => void;
};

const NavContext = createContext<NavState>();

export const NavProvider = (props: { children: any }) => {
  const [activeItem, setActiveItem] = createSignal<NavItem>("feed");
  const [searchOpen, setSearchOpen] = createSignal(false);

  const isActive = (item: NavItem) => activeItem() === item;
  const activate = (item: NavItem) => setActiveItem(item);
  const toggleSearch = () => setSearchOpen((prev) => !prev);

  return (
    <NavContext.Provider
      value={{
        activeItem,
        isActive,
        activate,
        searchOpen,
        toggleSearch,
      }}
    >
      {props.children}
    </NavContext.Provider>
  );
};


export const useNavState = () => useContext(NavContext)!;
