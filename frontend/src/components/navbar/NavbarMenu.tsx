import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import { useAuth } from "@/hooks/useAuth";
import { ListItem, List } from "../ui/molecules/List";
import { MenuItem } from "./Navbar";

type NavbarMenuProps = {
  onClose: () => void;
  items: MenuItem[];
};

const NavbarMenu = ({ onClose, items }: NavbarMenuProps) => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { isAuthenticated } = useAuthStore();

  const authItem = useMemo<ListItem>(() => {
    if (isAuthenticated) {
      return {
        label: "Logout",
        onClick: () => {
          logout();
          navigate("/login", { replace: true });
          onClose();
        },
      };
    }
    return {
      label: "Login",
      onClick: () => {
        navigate("/login", { replace: true });
        onClose();
      },
    };
  }, [isAuthenticated, logout, navigate, onClose]);

  const listItems = useMemo<ListItem[]>(() => {
    return [
      ...items.map((item) => ({
        label: typeof item.label === "function" ? item.label() : item.label,
        onClick: () => {
          item.action();
          onClose();
        },
      })),
      authItem,
    ];
  }, [items, authItem, onClose]);

  return <List items={listItems} />;
};

export default NavbarMenu;
