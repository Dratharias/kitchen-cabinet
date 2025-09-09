import { useLocation, useNavigate } from "@solidjs/router";
import { createSignal, createEffect, Accessor } from "solid-js";
import { isAuthenticated } from "../../services/authStore";
import { useLogout } from "../../services/ToastProvider";
import NavButtons from "./NavButtons";
import { useNavState } from "./NavContext";
import NavbarMenu from "./NavbarMenu";
import type { MenuItem } from "../../types/menu";
import ClickOutsideContainer from "../ui/ClickOutsideContainer";

const Navbar = () => {
  const { searchOpen, toggleSearch } = useNavState();
  const [isEditor, setIsEditor] = createSignal(true);
  const [open, setOpen] = createSignal(false);
  const [activeKey, setActiveKey] = createSignal<string>(
    localStorage.getItem("activeNav") || "feed"
  );

  const location = useLocation();
  const currentId = location.pathname.split("/").pop() || "";
  const navigate = useNavigate();
  const logout = useLogout();

  // Persistance de la navigation
  createEffect(() => {
    localStorage.setItem("activeNav", activeKey());
  });

  const activate = (key: string) => {
    setActiveKey(key);
    switch (key) {
      case "library":
        navigate("/library");
        break;
      case "feed":
        navigate("/feeds");
        break;
      default:
        console.warn("Unknown nav key:", key);
    }
  };

  const isActive = (key: string) => {
    if (key === "feed") return location.pathname === "/" || location.pathname.startsWith("/feeds");
    if (key === "review") return location.pathname.startsWith("/review");
    if (key === "library") return location.pathname.startsWith("/library");
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
    <nav class="w-full bg-mintsage-50 dark:bg-forest-400 text-forest-700 dark:text-harmony-100">
      <div class="max-w-7xl mx-auto p-2 sm:px-6 lg:px-8">
        {/* boutons principaux */}
        <div class="flex items-center text-nowrap justify-evenly h-16 space-x-2 text-center">
          <NavButtons.LibraryButton
            active={isActive("library")}
            onClick={() => activate("library")}
            class="px-3 py-2 rounded-md text-current hover:bg-forest-200 dark:hover:bg-harmony-700 transition-colors duration-200"
          />
          <NavButtons.SearchButton
            open={searchOpen()}
            onClick={toggleSearch}
            class="px-3 py-2 rounded-md text-current hover:bg-forest-200 dark:hover:bg-harmony-700 transition-colors duration-200"
          />
          <NavButtons.FeedButton
            active={isActive("feed")}
            onClick={() => activate("feed")}
            class="px-3 py-2 rounded-md text-current hover:bg-forest-200 dark:hover:bg-harmony-700 transition-colors duration-200"
          />
        </div>


        {/* menu toggle */}
        
          <ClickOutsideContainer
            onClickOutside={() => setOpen(false)}
            class=""
          >
            {/* bouton hamburger */}
            <NavButtons.HamburgerButton
              onClick={() => setOpen(!open())}
              class="fixed right-4 top-4 px-3 py-2 rounded-md text-current hover:bg-forest-200 dark:hover:bg-harmony-700 transition-colors duration-200"
            />
            {open() && (
              <div class="fixed right-6 top-16 mt-2 w-56 bg-mintsage-50 dark:bg-forest-400 border border-forest-300 dark:border-harmony-700 rounded-lg shadow-xl z-50 animate-fade-in">
                <NavbarMenu  items={menuItems} onClose={() => setOpen(false)} />
              </div>
            )}
          </ClickOutsideContainer>
        
      </div>
    </nav>
  );
};

export default Navbar;
