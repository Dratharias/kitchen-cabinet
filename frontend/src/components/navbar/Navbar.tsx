import { useLocation, useNavigate } from "@solidjs/router";
import { createSignal, createEffect, createMemo } from "solid-js";
import NavButtons from "./NavButtons";
import { useNavState } from "./NavContext";
import NavbarMenu from "./NavbarMenu";
import ClickOutsideContainer from "../ui/utilities/ClickOutsideContainer";
import { isAuthenticated } from "@/stores/authStore";

export interface MenuItem {
  label: string | (() => string);
  action: () => void;
}

const Navbar = () => {
  const { searchOpen, toggleSearch } = useNavState();
  const [open, setOpen] = createSignal(false);
  const [activeKey, setActiveKey] = createSignal<string>(
    localStorage.getItem("activeNav") || "feeds",
  );

  const location = useLocation();
  const navigate = useNavigate();

  // Persist navigation
  createEffect(() => {
    localStorage.setItem("activeNav", activeKey());
  });

  const activate = (key: string) => {
    setActiveKey(key);
    switch (key) {
      case "reviews":
        navigate("/reviews");
        break;
      case "feeds":
        navigate("/feeds");
        break;
      default:
        console.warn("Unknown nav key:", key);
    }
  };

  const isActive = (key: string) => {
    if (key === "feeds")
      return (
        location.pathname === "/" || location.pathname.startsWith("/feeds")
      );
    if (key === "reviews") return location.pathname.startsWith("/reviews");
    return false;
  };

  // Items communs (uniquement si connecté)
  const commonItems: MenuItem[] = [
    { label: "Create", action: () => navigate("/create") },
    { label: "Review", action: () => activate("/create") },
  ];

  // menuItems devient réactif
  const menuItems = createMemo(() => (isAuthenticated() ? commonItems : []));

  return (
    <nav class="w-full">
      <div class="md:max-w-2xl lg:max-w-4xl xl:max-w-6xl 2xl:max-w-7xl mx-auto p-2 sm:px-6 lg:px-8">
        {/* Primary buttons */}
        <div class="flex items-center text-nowrap justify-evenly h-16 space-x-2 text-center">
          <NavButtons.LibraryButton
            active={isActive("reviews")}
            onClick={() => activate("reviews")}
          />
          <NavButtons.SearchButton open={searchOpen()} onClick={toggleSearch} />
          <NavButtons.FeedButton
            active={isActive("feeds")}
            onClick={() => activate("feeds")}
          />
        </div>

        {/* Menu toggle */}
        <ClickOutsideContainer onClickOutside={() => setOpen(false)}>
          <NavButtons.HamburgerButton
            onClick={() => setOpen(!open())}
            open={open()}
            class="fixed right-4 top-4"
          />
          {open() && (
            <div class="fixed right-6 top-16 mt-2 w-56 z-50 animate-fade-in">
              <NavbarMenu items={menuItems()} onClose={() => setOpen(false)} />
            </div>
          )}
        </ClickOutsideContainer>
      </div>
    </nav>
  );
};

export default Navbar;
