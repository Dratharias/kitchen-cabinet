import { useNavigate } from "@solidjs/router";
import { createMemo } from "solid-js";
import { isAuthenticated } from "@/stores/authStore";
import { useAuth } from "@/hooks/useAuth";
import { ListItem, List } from "../ui/molecules/List";
import { MenuItem } from "./Navbar";

type NavbarMenuProps = {
  onClose: () => void;
  items: MenuItem[];
};

const NavbarMenu = (props: NavbarMenuProps) => {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const authItem = createMemo<ListItem>(() =>
    isAuthenticated()
      ? {
          label: "Logout",
          onClick: () => {
            logout();
            navigate("/login", { replace: true });
            props.onClose();
          },
        }
      : {
          label: "Login",
          onClick: () => {
            navigate("/login", { replace: true });
            props.onClose();
          },
        }
  );

  const listItems = createMemo<ListItem[]>(() => [
    ...props.items.map((item) => ({
      label: typeof item.label === "function" ? item.label() : item.label,
      onClick: () => {
        item.action();
        props.onClose();
      },
    })),
    authItem(),
  ]);

  return <List items={listItems()} />;
};

export default NavbarMenu;
