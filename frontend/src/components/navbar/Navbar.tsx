import { useLocation, useNavigate } from "@solidjs/router";
import { createSignal, createEffect } from "solid-js";
import { isAuthenticated } from "../../services/authStore";
import { useLogout } from "../../services/ToastProvider";
import NavButtons from "./NavButtons";
import { useNavState } from "./NavContext";
import NavbarMenu from "./NavbarMenu";
import type { MenuItem } from "../../types/menu";
import ClickOutsideContainer from "../ui/utilities/ClickOutsideContainer";
import { colorTheme, surfaceTheme } from "../../theme/colors";

const Navbar = () => {
  const { searchOpen, toggleSearch } = useNavState();
  const [isEditor] = createSignal(true);
  const [open, setOpen] = createSignal(false);
  const [activeKey, setActiveKey] = createSignal<string>(
    localStorage.getItem("activeNav") || "foods"
  );

  const location = useLocation();
  const currentId = location.pathname.split("/").pop() || "";
  const navigate = useNavigate();
  const logout = useLogout();

  // Persist navigation
  createEffect(() => {
    localStorage.setItem("activeNav", activeKey());
  });

  const activate = (key: string) => {
    setActiveKey(key);
    switch (key) {
      case "feeds":
        navigate("/feeds");
        break;
      case "foods":
        navigate("/foods");
        break;
      default:
        console.warn("Unknown nav key:", key);
    }
  };

  const isActive = (key: string) => {
    if (key === "foods") return location.pathname === "/" || location.pathname.startsWith("/foods");
    if (key === "feeds") return location.pathname.startsWith("/feeds");
    return false;
  };

  const commonItems: MenuItem[] = [
    {
      label: () => (isAuthenticated() ? "Logout" : "Login"),
      action: () => {
        if (isAuthenticated()) {
          logout();
        } else {
          navigate("/login", { replace: true });
        }
      },
    },
    { label: "Create", action: () => console.log("Create", currentId) },
    { label: "Review", action: () => activate("review") },
  ];

  const editorItems: MenuItem[] = [
    { label: "Modify", action: () => console.log("Modify", currentId) },
    { label: "Publish/Unpublish", action: () => console.log("Publish", currentId) },
    { label: "Restrict/Public", action: () => console.log("Restrict", currentId) },
    { label: "Delete", action: () => console.log("Delete", currentId) },
  ];

  const menuItems = isEditor() ? [...commonItems, ...editorItems] : commonItems;

  return (
    <nav class={`${colorTheme.Navbar} w-full`}>
      <div class="md:max-w-2xl lg:max-w-4xl xl:max-w-6xl 2xl:max-w-7xl mx-auto p-2 sm:px-6 lg:px-8">
        {/* Primary buttons */}
        <div class="flex items-center text-nowrap justify-evenly h-16 space-x-2 text-center">
          <NavButtons.LibraryButton
            active={isActive("feeds")}
            onClick={() => activate("feeds")}
            class={colorTheme.NavbarButton}
          />
          <NavButtons.SearchButton
            open={searchOpen()}
            onClick={toggleSearch}
            class={colorTheme.NavbarButton}
          />
          <NavButtons.FeedButton
            active={isActive("foods")}
            onClick={() => activate("foods")}
            class={colorTheme.NavbarButton}
          />
        </div>

        {/* Menu toggle */}
        <ClickOutsideContainer onClickOutside={() => setOpen(false)}>
          {/* bouton hamburger */}
          <NavButtons.HamburgerButton
            onClick={() => setOpen(!open())}
            class={`fixed right-4 top-4 ${colorTheme.NavbarButton}`}
          />

          {open() && (
            <div
              class={`${surfaceTheme.CardCompact} fixed right-6 top-16 mt-2 w-56 z-50 animate-fade-in`}
            >
              <NavbarMenu items={menuItems} onClose={() => setOpen(false)} />
            </div>
          )}
        </ClickOutsideContainer>
      </div>
    </nav>
  );
};

export default Navbar;
