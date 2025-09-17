import { useNavigate } from "@solidjs/router";
import { List, ListItem } from "../ui/atoms/List";
import RequireAuth from "../ui/utilities/RequireAuth";
import type { MenuItem } from "../../types/menu";

type NavbarMenuProps = {
  open?: boolean;
  onClose: () => void;
  items: MenuItem[];
};

// Fonction pour générer le fallback (Login)
const renderLoginFallback = (onClose: () => void) => {
  const navigate = useNavigate();
  const listItems: ListItem[] = [
    {
      label: "Login",
      onClick: () => {
        navigate("/login", { replace: true });
        onClose();
      },
    },
  ];
  return <List items={listItems} />;
};

const NavbarMenu = (props: NavbarMenuProps) => {

  const listItems: ListItem[] = props.items.map((item) => ({
    label: typeof item.label === "function" ? item.label() : item.label,
    onClick: () => {
      item.action();
      props.onClose();
    },
  }));

  return (
    <RequireAuth fallback={renderLoginFallback(props.onClose)}>
      <List items={listItems} />
    </RequireAuth>
  );
};

export default NavbarMenu;
