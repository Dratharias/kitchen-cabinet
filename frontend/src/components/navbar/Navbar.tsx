import { useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect, useMemo } from "react";
import NavButtons from "./NavButtons";
import { useNavState } from "./NavContext";
import NavbarMenu from "./NavbarMenu";
import ClickOutsideContainer from "../ui/utilities/ClickOutsideContainer";
import { useAuthStore } from "@/stores/authStore";

export interface MenuItem {
  label: string | (() => string);
  action: () => void;
}

const Navbar = () => {
  const { searchOpen, toggleSearch } = useNavState();
  const [open, setOpen] = useState(false);
  const [activeKey, setActiveKey] = useState<string>(
    localStorage.getItem("activeNav") || "feeds"
  );

  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();

  // Persiste la clé de navigation active
  useEffect(() => {
    localStorage.setItem("activeNav", activeKey);
  }, [activeKey]);

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
    if (key === "feeds") {
      return location.pathname === "/" || location.pathname.startsWith("/feeds");
    }
    if (key === "reviews") return location.pathname.startsWith("/reviews");
    return false;
  };

  const commonItems: MenuItem[] = [
    { label: "Create", action: () => navigate("/create") },
    { label: "Review", action: () => activate("reviews") },
  ];

  const menuItems = useMemo(() => (isAuthenticated ? commonItems : []), [isAuthenticated]);

  return (
    <nav className="w-full">
      <div className="md:max-w-2xl lg:max-w-4xl xl:max-w-6xl 2xl:max-w-7xl mx-auto p-2 sm:px-6 lg:px-8">
        {/* Primary buttons */}
        <div className="flex items-center justify-evenly h-16 space-x-2 text-center text-nowrap">
          <NavButtons.LibraryButton
            active={isActive("reviews")}
            onClick={() => activate("reviews")}
          />
          <NavButtons.SearchButton open={searchOpen} onClick={toggleSearch} />
          <NavButtons.FeedButton
            active={isActive("feeds")}
            onClick={() => activate("feeds")}
          />
        </div>

        {/* Menu toggle */}
        <ClickOutsideContainer onClickOutside={() => setOpen(false)}>
          <NavButtons.HamburgerButton
            onClick={() => setOpen((v) => !v)}
            open={open}
            className="fixed right-4 top-4"
          />
          {open && (
            <div className="fixed right-6 top-16 mt-2 w-56 z-50 animate-fade-in">
              <NavbarMenu items={menuItems} onClose={() => setOpen(false)} />
            </div>
          )}
        </ClickOutsideContainer>
      </div>
    </nav>
  );
};

export default Navbar;
