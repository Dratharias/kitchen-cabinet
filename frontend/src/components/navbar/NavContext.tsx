import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useCallback,
  JSX,
} from "react";

export type NavItem = "feed" | "library";

type NavState = {
  activeItem: NavItem;
  isActive: (item: NavItem) => boolean;
  activate: (item: NavItem) => void;
  searchOpen: boolean;
  toggleSearch: () => void;
};

const NavContext = createContext<NavState | undefined>(undefined);

export function NavProvider({ children }: { children: ReactNode }): JSX.Element {
  const [activeItem, setActiveItem] = useState<NavItem>("feed");
  const [searchOpen, setSearchOpen] = useState(false);

  const isActive = useCallback((item: NavItem) => activeItem === item, [activeItem]);
  const activate = useCallback((item: NavItem) => setActiveItem(item), []);
  const toggleSearch = useCallback(() => setSearchOpen((prev) => !prev), []);

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
      {children}
    </NavContext.Provider>
  );
}

export function useNavState() {
  const ctx = useContext(NavContext);
  if (!ctx) throw new Error("useNavState must be used within a NavProvider");
  return ctx;
}
